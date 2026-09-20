import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { REQUEST_TYPE_LABELS, titleCase, PRODUCTION_STAGES } from "@/lib/production-spec";
import type { JobSnapshot } from "@/lib/production-jobs";

export const Route = createFileRoute("/_authenticated/admin/production")({
  component: ProductionQueue,
});

function ProductionQueue() {
  const [stage, setStage] = useState("all");
  const [method, setMethod] = useState("all");

  const jobs = useQuery({
    queryKey: ["production-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_jobs")
        .select(
          "id, job_number, stage, priority, due_date, is_production_ready, created_at, snapshot, order_id, orders(order_number, contact_name, payment_status)",
        )
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const rows = (jobs.data ?? []).filter((j) => {
    const snap = j.snapshot as JobSnapshot | null;
    if (stage !== "all" && j.stage !== stage) return false;
    if (method !== "all" && snap?.decorationMethod !== method) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-heading text-4xl">Production</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jobs locked from approved customer designs. Open a job for the full spec.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            aria-label="Filter by stage"
            className="h-10 border border-border bg-background px-3 text-sm"
          >
            <option value="all">All stages</option>
            {PRODUCTION_STAGES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            aria-label="Filter by decoration method"
            className="h-10 border border-border bg-background px-3 text-sm"
          >
            <option value="all">All methods</option>
            {["screen", "dtf", "dtf_transfer", "embroidery"].map((m) => (
              <option key={m} value={m}>
                {REQUEST_TYPE_LABELS[m] ?? titleCase(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {jobs.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {!jobs.isLoading && rows.length === 0 && (
          <p className="border border-dashed border-border p-6 text-sm text-muted-foreground">
            No production jobs yet. Approve a proof on an order in the inbox to create one.
          </p>
        )}
        {rows.map((j) => {
          const snap = j.snapshot as JobSnapshot | null;
          const item = snap?.items?.[0];
          return (
            <Link
              key={j.id}
              to="/admin/jobs/$jobId"
              params={{ jobId: j.id }}
              className="grid gap-2 border border-border bg-card p-4 hover:border-primary sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-mono text-xs text-primary">{j.job_number}</p>
                <p className="mt-1 font-semibold">
                  {item?.productName ?? "Custom job"} · {item?.colorName ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {REQUEST_TYPE_LABELS[snap?.decorationMethod ?? ""] ??
                    titleCase(snap?.decorationMethod ?? "—")}{" "}
                  · {snap?.items?.reduce((n, i) => n + (i.quantity ?? 0), 0) ?? 0} pieces ·{" "}
                  {j.orders?.contact_name ?? "—"} · {j.orders?.order_number ?? ""}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {j.priority !== "normal" && (
                  <span className="bg-primary px-2 py-1 font-bold uppercase text-primary-foreground">
                    {j.priority}
                  </span>
                )}
                <span className="border border-border px-2 py-1 font-bold uppercase">
                  {titleCase(j.stage)}
                </span>
                <span
                  className={
                    j.is_production_ready
                      ? "bg-foreground px-2 py-1 font-bold uppercase text-background"
                      : "border border-dashed border-border px-2 py-1 uppercase text-muted-foreground"
                  }
                >
                  {j.is_production_ready ? "Ready" : "Blocked"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
