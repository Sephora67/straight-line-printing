import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/lib/permissions.functions";
import { makeNumber, validateReadiness, type DesignSnapshot } from "@/lib/production-spec";
import type { JobSnapshot } from "@/lib/production-jobs";

type FrozenItem = { id: string; quantity: number; frozen_config: DesignSnapshot; decoration_method_id: string | null; design_id: string | null };

function methodOf(config: DesignSnapshot) {
  return config.decorationMethod || "dtf";
}

async function loadOrder(context: Parameters<typeof requirePermission>[0], orderId: string) {
  const { data, error } = await context.supabase
    .from("orders")
    .select("id,order_number,contact_name,contact_email,contact_phone,notes,due_date,priority,quote_id,payment_status,status,order_items(id,quantity,frozen_config,decoration_method_id,design_id)")
    .eq("id", orderId)
    .single();
  if (error) throw new Error(error.message);
  return { ...data, order_items: (data.order_items ?? []) as unknown as FrozenItem[] };
}

export const decideProduction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid(), action: z.enum(["request_proof", "approve_proof", "direct", "hold"]), proofId: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "orders.status");
    const order = await loadOrder(context, data.orderId);
    const now = new Date().toISOString();

    if (data.action === "hold") {
      const { error } = await context.supabase.from("orders").update({ production_decision: "hold", production_approved_at: null, production_approved_by: null }).eq("id", order.id);
      if (error) throw new Error(error.message);
      await context.supabase.from("audit_log").insert({ user_id: context.userId, entity_type: "orders", entity_id: order.id, action: "production_hold", after_value: { production_decision: "hold" } });
      return { action: data.action, jobs: [] as string[] };
    }

    if (data.action === "request_proof") {
      await requirePermission(context, "designs.approve");
      const { data: versions, error: versionError } = await context.supabase.from("proofs").select("version").eq("order_id", order.id).order("version", { ascending: false }).limit(1);
      if (versionError) throw new Error(versionError.message);
      const version = (versions?.[0]?.version ?? 0) + 1;
      const { data: proof, error: proofError } = await context.supabase.from("proofs").insert({
        order_id: order.id,
        version,
        status: "sent",
        frozen_config: { items: order.order_items.map((item) => ({ id: item.id, quantity: item.quantity, frozen_config: item.frozen_config })) },
      }).select("id,version").single();
      if (proofError) throw new Error(proofError.message);
      const { error: orderError } = await context.supabase.from("orders").update({ production_decision: "proof_requested" }).eq("id", order.id);
      if (orderError) throw new Error(orderError.message);
      await context.supabase.from("audit_log").insert({ user_id: context.userId, entity_type: "proofs", entity_id: proof.id, action: "proof_requested", after_value: { order_id: order.id, version } });
      return { action: data.action, proof, jobs: [] as string[] };
    }

    await requirePermission(context, "designs.approve");
    let sourceItems = order.order_items;
    let proofId: string | null = null;
    let sourceVersion = 1;
    let sourceType: "approved_proof" | "direct_approval" = "direct_approval";

    if (data.action === "approve_proof") {
      if (!data.proofId) throw new Error("Choose the proof version to approve.");
      const { data: proof, error: proofError } = await context.supabase.from("proofs").select("id,version,frozen_config").eq("id", data.proofId).eq("order_id", order.id).single();
      if (proofError) throw new Error(proofError.message);
      const frozen = proof.frozen_config as unknown as { items?: FrozenItem[] };
      if (!frozen.items?.length) throw new Error("The selected proof has no frozen design items.");
      sourceItems = frozen.items;
      proofId = proof.id;
      sourceVersion = proof.version;
      sourceType = "approved_proof";
      const { error: approveError } = await context.supabase.from("proofs").update({ status: "approved", approved_by: context.userId, approved_at: now }).eq("id", proof.id);
      if (approveError) throw new Error(approveError.message);
    }

    if (!sourceItems.length) throw new Error("This order has no design items to send to production.");
    const commercialApproved = order.payment_status === "paid" || order.status === "paid";
    const validationErrors = sourceItems.flatMap((item, index) => validateReadiness({
      snapshot: { ...item.frozen_config, quantity: item.quantity },
      decorationMethod: methodOf(item.frozen_config),
      proofApproved: true,
      paymentOrQuoteApproved: commercialApproved,
      productionFilesApproved: true,
      requiresProductionFile: false,
    }).filter((check) => !check.ok).map((check) => `Item ${index + 1}: ${check.label}${check.detail ? ` — ${check.detail}` : ""}`));
    if (validationErrors.length) throw new Error(`Production handoff is blocked. ${validationErrors.join("; ")}`);

    const groups = new Map<string, FrozenItem[]>();
    for (const item of sourceItems) groups.set(methodOf(item.frozen_config), [...(groups.get(methodOf(item.frozen_config)) ?? []), item]);
    const created: string[] = [];
    for (const [method, items] of groups) {
      const sourceKey = `${order.id}:${sourceType}:${proofId ?? "direct"}:${sourceVersion}:${method}`;
      const snapshot: JobSnapshot = {
        version: 1, lockedAt: now, decorationMethod: method,
        customer: { name: order.contact_name, email: order.contact_email, phone: order.contact_phone },
        orderNumber: order.order_number, quoteNumber: null, notes: order.notes,
        items: items.map((item) => ({ ...item.frozen_config, quantity: item.quantity, orderItemId: item.id })),
      };
      const readiness = items.map((item) => validateReadiness({ snapshot: { ...item.frozen_config, quantity: item.quantity }, decorationMethod: method, proofApproved: true, paymentOrQuoteApproved: commercialApproved, productionFilesApproved: false, requiresProductionFile: method === "embroidery" || method === "screen" }));
      const { data: job, error: jobError } = await context.supabase.from("production_jobs").insert({
        source_key: sourceKey, job_number: makeNumber("JOB"), order_id: order.id, order_item_id: items[0]?.id ?? null,
        stage: proofId ? "proof_approved" : "artwork_review", due_date: order.due_date, priority: order.priority ?? "normal",
        proof_id: proofId, source_proof_id: proofId, source_type: sourceType, source_version: sourceVersion, approved_by: context.userId,
        snapshot: snapshot as never, production_data: {}, readiness: readiness as never, locked_at: now,
      }).select("id").single();
      if (jobError) {
        if (jobError.code === "23505") continue;
        throw new Error(jobError.message);
      }
      created.push(job.id);
      const files = snapshot.items.flatMap((item) => (item.placements ?? []).flatMap((placement) => (placement.layers ?? []).filter((layer) => layer.artworkPath).map((layer) => ({ production_job_id: job.id, kind: "customer_artwork", label: `${layer.artworkName ?? "artwork"} — ${placement.view}`, storage_path: layer.artworkPath ?? null, is_approved: false }))));
      if (files.length) {
        const { error: fileError } = await context.supabase.from("production_files").insert(files);
        if (fileError) throw new Error(fileError.message);
      }
      await context.supabase.from("audit_log").insert({ user_id: context.userId, entity_type: "production_jobs", entity_id: job.id, action: "job_created_from_frozen_approval", after_value: { order_id: order.id, source_type: sourceType, source_version: sourceVersion, proof_id: proofId, decoration_method: method } });
    }
    const decision = proofId ? "approved_proof" : "direct";
    const { error: orderError } = await context.supabase.from("orders").update({ production_decision: decision, production_approved_at: now, production_approved_by: context.userId, status: "in_production" }).eq("id", order.id);
    if (orderError) throw new Error(orderError.message);
    return { action: data.action, jobs: created };
  });