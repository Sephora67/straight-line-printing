import { supabase } from "@/integrations/supabase/client";
import {
  makeNumber,
  validateReadiness,
  isReady,
  type DesignSnapshot,
  type ReadinessCheck,
} from "@/lib/production-spec";

export type JobSnapshot = {
  version: 1;
  lockedAt: string;
  decorationMethod: string;
  customer: { name: string | null; email: string | null; phone: string | null };
  orderNumber: string | null;
  quoteNumber: string | null;
  items: (DesignSnapshot & { quantity: number; orderItemId: string | null })[];
  notes: string | null;
};

function methodOf(config: Record<string, unknown> | null | undefined) {
  const value =
    (config?.["decoration_method"] as string | undefined) ??
    (config?.["decorationMethod"] as string | undefined);
  return value && value.length > 0 ? value : "dtf";
}

/** Copy an approved quote into a real order, keeping every frozen snapshot. */
export async function convertQuoteToOrder(quoteId: string) {
  const { data: quote, error } = await supabase
    .from("quotes")
    .select(
      "id, quote_number, user_id, contact_name, contact_email, contact_phone, notes, subtotal, total, deadline, request_type, quote_items(*)",
    )
    .eq("id", quoteId)
    .single();
  if (error) throw new Error(error.message);

  const orderNumber = makeNumber("ORD");
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: quote.user_id,
      quote_id: quote.id,
      request_type: quote.request_type ?? "bulk",
      contact_name: quote.contact_name,
      contact_email: quote.contact_email,
      contact_phone: quote.contact_phone,
      notes: quote.notes,
      status: "pending",
      payment_status: "unpaid",
      due_date: quote.deadline,
      subtotal: quote.subtotal ?? 0,
      total: quote.total ?? 0,
    })
    .select("id, order_number")
    .single();
  if (orderError) throw new Error(orderError.message);

  for (const item of quote.quote_items ?? []) {
    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: item.product_id,
      design_id: item.design_id,
      decoration_method_id: item.decoration_method_id,
      description: item.description,
      quantity: item.quantity,
      quantity_matrix: item.quantity_matrix,
      unit_price: item.unit_price,
      line_total: item.line_total,
      price_breakdown: item.price_breakdown,
      frozen_config: item.config_snapshot,
    });
  }

  await supabase.from("quotes").update({ status: "converted" }).eq("id", quote.id);
  await supabase.from("audit_log").insert({
    entity_type: "quotes",
    entity_id: quote.id,
    action: "converted_to_order",
    after_value: { order_id: order.id, order_number: order.order_number },
  });
  return order;
}

/** Create a proof version from the current frozen configuration of an order. */
export async function createProofForOrder(orderId: string, note?: string) {
  const { data: items } = await supabase
    .from("order_items")
    .select("id, frozen_config")
    .eq("order_id", orderId);
  const { data: existing } = await supabase
    .from("proofs")
    .select("version")
    .eq("order_id", orderId)
    .order("version", { ascending: false })
    .limit(1);
  const version = (existing?.[0]?.version ?? 0) + 1;
  const { data, error } = await supabase
    .from("proofs")
    .insert({
      order_id: orderId,
      version,
      status: "sent",
      staff_note: note ?? null,
      frozen_config: { items: items ?? [] } as never,
    })
    .select("id, version")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("orders").update({ status: "pending" }).eq("id", orderId);
  await supabase.from("audit_log").insert({
    entity_type: "proofs",
    entity_id: data.id,
    action: "proof_sent",
    after_value: { order_id: orderId, version },
  });
  return data;
}

/**
 * Lock the approved configuration into production jobs — one job per
 * decoration method present on the order. Existing jobs are never rewritten.
 */
export async function createProductionJobsForOrder(orderId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, contact_name, contact_email, contact_phone, notes, due_date, priority, quote_id, order_items(id, quantity, frozen_config, decoration_method_id, design_id)",
    )
    .eq("id", orderId)
    .single();
  if (error) throw new Error(error.message);

  const { data: approvedProof } = await supabase
    .from("proofs")
    .select("id, version, status")
    .eq("order_id", orderId)
    .eq("status", "approved")
    .order("version", { ascending: false })
    .limit(1);

  const { data: existingJobs } = await supabase
    .from("production_jobs")
    .select("id, decoration_method_id, snapshot")
    .eq("order_id", orderId);
  const existingMethods = new Set(
    (existingJobs ?? []).map((j) => (j.snapshot as { decorationMethod?: string } | null)?.decorationMethod),
  );

  const groups = new Map<string, typeof order.order_items>();
  for (const item of order.order_items ?? []) {
    const key = methodOf(item.frozen_config as Record<string, unknown>);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const created: string[] = [];
  for (const [method, items] of groups) {
    if (existingMethods.has(method)) continue;
    const snapshot: JobSnapshot = {
      version: 1,
      lockedAt: new Date().toISOString(),
      decorationMethod: method,
      customer: {
        name: order.contact_name,
        email: order.contact_email,
        phone: order.contact_phone,
      },
      orderNumber: order.order_number,
      quoteNumber: null,
      notes: order.notes ?? null,
      items: items.map((i) => ({
        ...(i.frozen_config as unknown as DesignSnapshot),
        quantity: i.quantity,
        orderItemId: i.id,
      })),
    };

    const { data: job, error: jobError } = await supabase
      .from("production_jobs")
      .insert({
        source_key: `${order.id}:legacy:${method}`,
        job_number: makeNumber("JOB"),
        order_id: order.id,
        order_item_id: items[0]?.id ?? null,
        stage: approvedProof?.[0] ? "proof_approved" : "artwork_review",
        due_date: order.due_date,
        priority: order.priority ?? "normal",
        proof_id: approvedProof?.[0]?.id ?? null,
        design_version_id:
          ((items[0]?.frozen_config as Record<string, unknown>)?.["design_version_id"] as string) ??
          null,
        snapshot: snapshot as never,
        production_data: {} as never,
        readiness: {} as never,
        locked_at: approvedProof?.[0] ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (jobError) throw new Error(jobError.message);
    created.push(job.id);

    // production files: customer originals stay untouched, referenced per job
    const files: {
      production_job_id: string;
      kind: string;
      label: string;
      storage_path: string | null;
      is_approved: boolean;
    }[] = [];
    for (const item of snapshot.items) {
      for (const placement of item.placements ?? []) {
        for (const layer of placement.layers ?? []) {
          if (layer.artworkPath) {
            files.push({
              production_job_id: job.id,
              kind: "customer_artwork",
              label: `${layer.artworkName ?? "artwork"} — ${placement.view}`,
              storage_path: layer.artworkPath,
              is_approved: false,
            });
          }
        }
      }
    }
    if (files.length) await supabase.from("production_files").insert(files);

    await supabase.from("audit_log").insert({
      entity_type: "production_jobs",
      entity_id: job.id,
      action: "job_created",
      after_value: { order_id: order.id, decoration_method: method },
    });
  }
  return created;
}

export async function jobReadiness(job: {
  id: string;
  snapshot: unknown;
  proof_id: string | null;
  order: { payment_status?: string | null; status?: string | null } | null;
  approvedFiles: number;
}): Promise<ReadinessCheck[]> {
  const snap = job.snapshot as JobSnapshot | null;
  const first = snap?.items?.[0] ?? null;
  const method = snap?.decorationMethod ?? null;
  return validateReadiness({
    snapshot: first,
    decorationMethod: method,
    proofApproved: Boolean(job.proof_id),
    paymentOrQuoteApproved:
      job.order?.payment_status === "paid" ||
      ["paid", "in_production", "ready", "shipped", "completed"].includes(
        job.order?.status ?? "",
      ),
    productionFilesApproved: job.approvedFiles > 0,
    requiresProductionFile: method === "embroidery" || method === "screen",
  });
}

export { isReady };
