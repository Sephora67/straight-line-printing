import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DesignSpec } from "@/components/admin/DesignSpec";
import {
  PRIORITIES,
  REQUEST_TYPE_LABELS,
  titleCase,
  type DesignSnapshot,
} from "@/lib/production-spec";
import {
  convertQuoteToOrder,
} from "@/lib/production-jobs";
import { decideProduction } from "@/lib/production-approval.functions";

export const Route = createFileRoute("/_authenticated/admin/requests/$kind/$id")({
  component: RequestDetail,
});

const QUOTE_STATUSES = [
  "new",
  "reviewing",
  "waiting_customer",
  "artwork_required",
  "pricing",
  "quote_sent",
  "customer_reviewing",
  "approved",
  "declined",
  "expired",
  "converted",
  "cancelled",
];
const ORDER_STATUSES = [
  "pending",
  "paid",
  "in_production",
  "ready",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

function RequestDetail() {
  const { kind, id } = Route.useParams();
  const isQuote = kind === "quote";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [internal, setInternal] = useState(true);
  const decideProductionFn = useServerFn(decideProduction);

  const record = useQuery({
    queryKey: ["request", kind, id],
    queryFn: async () => {
      if (isQuote) {
        const { data, error } = await supabase
          .from("quotes")
          .select("*, quote_items(*)")
          .eq("id", id)
          .single();
        if (error) throw new Error(error.message);
        return data as Record<string, unknown> & { quote_items: Record<string, unknown>[] };
      }
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), production_jobs(id, job_number, stage, is_production_ready), proofs(id, version, status, created_at)")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data as Record<string, unknown> & { order_items: Record<string, unknown>[] };
    },
  });

  const messages = useQuery({
    queryKey: ["request-messages", kind, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("request_messages")
        .select("*")
        .eq(isQuote ? "quote_id" : "order_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const patch = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const table = isQuote ? "quotes" : "orders";
      const { error } = await supabase.from(table).update(values as never).eq("id", id);
      if (error) throw new Error(error.message);
      await supabase.from("audit_log").insert({
        entity_type: table,
        entity_id: id,
        action: "updated",
        after_value: values as never,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["request", kind, id] });
      void qc.invalidateQueries({ queryKey: ["admin-inbox"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMessage = useMutation({
    mutationFn: async () => {
      if (!note.trim()) return;
      const { error } = await supabase.from("request_messages").insert({
        quote_id: isQuote ? id : null,
        order_id: isQuote ? null : id,
        body: note.trim(),
        is_internal: internal,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNote("");
      void qc.invalidateQueries({ queryKey: ["request-messages", kind, id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const productionDecision = useMutation({
    mutationFn: (input: { action: "request_proof" | "approve_proof" | "direct" | "hold"; proofId?: string }) =>
      decideProductionFn({ data: { orderId: id, ...input } }),
    onSuccess: (result) => {
      const message = result.action === "request_proof"
        ? "Proof created and marked for customer review"
        : result.action === "hold"
          ? "Order placed on hold"
          : result.jobs.length
            ? `${result.jobs.length} production job(s) created from the frozen snapshot`
            : "Production jobs already exist for this approval";
      toast.success(message);
      void qc.invalidateQueries({ queryKey: ["request", kind, id] });
      void qc.invalidateQueries({ queryKey: ["production-queue"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (record.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (record.error || !record.data) return <p className="text-primary">Request not found.</p>;

  const r = record.data as never as {
    id: string;
    quote_number?: string;
    order_number?: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    company?: string | null;
    status: string;
    request_type: string | null;
    priority: string | null;
    deadline?: string | null;
    due_date?: string | null;
    payment_status?: string | null;
    production_decision?: string;
    notes: string | null;
    staff_notes: string | null;
    created_at: string;
    quote_items?: { id: string; description: string | null; quantity: number; config_snapshot: DesignSnapshot }[];
    order_items?: { id: string; description: string | null; quantity: number; frozen_config: DesignSnapshot }[];
    production_jobs?: { id: string; job_number: string; stage: string; is_production_ready: boolean }[];
    proofs?: { id: string; version: number; status: string; created_at: string }[];
  };

  const items = isQuote
    ? (r.quote_items ?? []).map((i) => ({ id: i.id, quantity: i.quantity, snapshot: i.config_snapshot }))
    : (r.order_items ?? []).map((i) => ({ id: i.id, quantity: i.quantity, snapshot: i.frozen_config }));

  return (
    <div className="grid gap-8">
      <div>
        <Link to="/admin/inbox" className="text-xs font-bold uppercase tracking-widest text-primary">
          ← Inbox
        </Link>
        <h1 className="display-heading mt-2 text-4xl">
          {r.quote_number ?? r.order_number}
        </h1>
        <p className="text-sm text-muted-foreground">
          {REQUEST_TYPE_LABELS[r.request_type ?? ""] ?? titleCase(r.request_type ?? "")} · created{" "}
          {new Date(r.created_at).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <section className="border border-border bg-card p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Customer
            </h2>
            <p className="mt-2 font-semibold">{r.contact_name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{r.contact_email ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{r.contact_phone ?? "—"}</p>
            {r.notes && <p className="mt-3 whitespace-pre-wrap text-sm">{r.notes}</p>}
          </section>

          <section className="grid gap-4">
            <h2 className="display-heading text-2xl">Customer design configuration</h2>
            {items.length === 0 && (
              <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                No configured items on this request.
              </p>
            )}
            {items.map((i) => (
              <DesignSpec key={i.id} snapshot={{ ...i.snapshot, quantity: i.quantity }} />
            ))}
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="display-heading text-2xl">Notes &amp; messages</h2>
            <Textarea
              className="mt-3"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note or a message to the customer"
            />
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(e) => setInternal(e.target.checked)}
                />
                Internal only
              </label>
              <Button size="sm" onClick={() => addMessage.mutate()}>
                Add
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {(messages.data ?? []).map((m) => (
                <div key={m.id} className="border-l-2 border-border pl-3 text-sm">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {m.is_internal ? "Internal" : "Customer visible"} ·{" "}
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid h-fit gap-4 border border-border bg-card p-4">
          <Field label="Status">
            <select
              className="h-10 w-full border border-border bg-background px-2 text-sm"
              value={r.status}
              onChange={(e) => patch.mutate({ status: e.target.value })}
            >
              {(isQuote ? QUOTE_STATUSES : ORDER_STATUSES).map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority">
            <select
              className="h-10 w-full border border-border bg-background px-2 text-sm"
              value={r.priority ?? "normal"}
              onChange={(e) => patch.mutate({ priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={isQuote ? "Deadline" : "Production due date"}>
            <Input
              type="date"
              defaultValue={(isQuote ? r.deadline : r.due_date) ?? ""}
              onBlur={(e) =>
                patch.mutate(isQuote ? { deadline: e.target.value } : { due_date: e.target.value })
              }
            />
          </Field>

          {!isQuote && (
            <Field label="Payment">
              <select
                className="h-10 w-full border border-border bg-background px-2 text-sm"
                value={r.payment_status ?? "unpaid"}
                onChange={(e) => patch.mutate({ payment_status: e.target.value })}
              >
                {["unpaid", "pending", "paid", "refunded"].map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Staff notes">
            <Textarea
              rows={3}
              defaultValue={r.staff_notes ?? ""}
              onBlur={(e) => patch.mutate({ staff_notes: e.target.value })}
            />
          </Field>

          {isQuote ? (
            <Button
              onClick={async () => {
                try {
                  const order = await convertQuoteToOrder(id);
                  toast.success(`Converted to ${order.order_number}`);
                  void navigate({
                    to: "/admin/requests/$kind/$id",
                    params: { kind: "order", id: order.id },
                  });
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Convert to order
            </Button>
          ) : (
            <div className="grid gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Production decision · {titleCase(r.production_decision ?? "review")}
              </p>
              <Button variant="outline" disabled={productionDecision.isPending} onClick={() => productionDecision.mutate({ action: "request_proof" })}>
                Request proof
              </Button>
              {(r.proofs ?? []).filter((proof) => proof.status !== "approved").map((proof) => (
                <Button key={proof.id} disabled={productionDecision.isPending} onClick={() => productionDecision.mutate({ action: "approve_proof", proofId: proof.id })}>
                  Approve proof v{proof.version} &amp; send to production
                </Button>
              ))}
              <Button disabled={productionDecision.isPending} onClick={() => productionDecision.mutate({ action: "direct" })}>
                Send directly to production
              </Button>
              <Button variant="outline" disabled={productionDecision.isPending} onClick={() => productionDecision.mutate({ action: "hold" })}>
                Hold
              </Button>
            </div>
          )}

          {!isQuote && (r.proofs?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Proofs
              </p>
              {(r.proofs ?? []).map((p) => (
                <div key={p.id} className="mt-2 flex items-center justify-between text-sm">
                  <span>
                    v{p.version} · {titleCase(p.status)}
                  </span>
                  {p.status !== "approved" && <span className="text-xs text-muted-foreground">Awaiting decision above</span>}
                </div>
              ))}
            </div>
          )}

          {!isQuote && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Linked production jobs
              </p>
              {(r.production_jobs ?? []).length === 0 && (
                <p className="mt-1 text-sm text-muted-foreground">None yet.</p>
              )}
              {(r.production_jobs ?? []).map((j) => (
                <Link
                  key={j.id}
                  to="/admin/jobs/$jobId"
                  params={{ jobId: j.id }}
                  className="mt-2 block border border-border p-2 text-sm hover:border-primary"
                >
                  <span className="font-mono text-xs text-primary">{j.job_number}</span>
                  <span className="ml-2">{titleCase(j.stage)}</span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
