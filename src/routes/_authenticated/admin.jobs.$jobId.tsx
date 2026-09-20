import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DesignSpec } from "@/components/admin/DesignSpec";
import { PRIORITIES, PRODUCTION_STAGES, REQUEST_TYPE_LABELS, isReady, titleCase, validateReadiness } from "@/lib/production-spec";
import type { JobSnapshot } from "@/lib/production-jobs";
import { downloadProductionPdf, downloadProductionZip } from "@/lib/production-package";

export const Route = createFileRoute("/_authenticated/admin/jobs/$jobId")({
  component: JobDetail,
});

const METHOD_FIELDS: Record<string, string[]> = {
  screen: ["ink_colours", "ink_notes", "screens", "squeegee", "setup_notes"],
  dtf: ["print_notes", "press_temp", "press_time", "peel"],
  dtf_transfer: ["sheet_size", "gang_layout", "margin_in", "spacing_in", "sheet_notes"],
  embroidery: ["stitch_count", "thread_colours", "digitised_file", "digitisation_status", "hooping"],
};

function JobDetail() {
  const { jobId } = Route.useParams();
  const qc = useQueryClient();
  const [override, setOverride] = useState({ field: "", value: "", reason: "" });
  const [qcNote, setQcNote] = useState("");
  const [downloading, setDownloading] = useState(false);

  const job = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_jobs")
        .select(
          "*, orders(id, order_number, contact_name, contact_email, contact_phone, payment_status, status, due_date, notes), production_overrides(*), production_files(*), qc_records(*)",
        )
        .eq("id", jobId)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const patch = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { error } = await supabase
        .from("production_jobs")
        .update(values as never)
        .eq("id", jobId);
      if (error) throw new Error(error.message);
      await supabase.from("audit_log").insert({
        entity_type: "production_jobs",
        entity_id: jobId,
        action: "job_updated",
        after_value: values as never,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      void qc.invalidateQueries({ queryKey: ["production-queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (job.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (job.error || !job.data) return <p className="text-primary">Job not found.</p>;

  const j = job.data as never as {
    id: string;
    job_number: string;
    stage: string;
    priority: string;
    due_date: string | null;
    notes: string | null;
    proof_id: string | null;
    locked_at: string | null;
    is_production_ready: boolean;
    production_data: Record<string, string> | null;
    snapshot: JobSnapshot | null;
    orders: {
      id: string;
      order_number: string;
      contact_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      payment_status: string | null;
      status: string | null;
      notes: string | null;
    } | null;
    production_overrides: { id: string; field_key: string; override_value: string; calculated_value: string | null; reason: string | null; created_at: string }[];
    production_files: { id: string; kind: string; label: string | null; storage_path: string | null; is_approved: boolean }[];
    qc_records: { id: string; result: string; notes: string | null; created_at: string }[];
  };

  const snap = j.snapshot;
  const method = snap?.decorationMethod ?? "dtf";
  const items = snap?.items ?? [];
  const approvedFiles = j.production_files.filter((f) => f.kind === "production_artwork" && f.is_approved).length;

  // Every item on the job must be complete, not only the first one.
  const perItemChecks = (items.length ? items : [null]).map((item) =>
    validateReadiness({
      snapshot: item,
      decorationMethod: method,
      proofApproved: Boolean(j.proof_id),
      paymentOrQuoteApproved:
        j.orders?.payment_status === "paid" ||
        ["paid", "in_production", "ready", "shipped", "completed"].includes(j.orders?.status ?? ""),
      productionFilesApproved: approvedFiles > 0,
      requiresProductionFile: method === "embroidery" || method === "screen",
    }),
  );
  const checks = (perItemChecks[0] ?? []).map((check, index) => {
    const all = perItemChecks.map((list) => list[index]!);
    return {
      ...check,
      ok: all.every((c) => c.ok),
      detail: all.map((c) => c.detail).filter(Boolean).join(" · "),
    };
  });
  const ready = isReady(checks);

  const overrideMap: Record<string, { value: string; original: string | null; reason: string | null }> = {};
  for (const o of j.production_overrides) {
    overrideMap[o.field_key] = {
      value: o.override_value,
      original: o.calculated_value,
      reason: o.reason,
    };
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/production" className="text-xs font-bold uppercase tracking-widest text-primary">
            ← Production queue
          </Link>
          <h1 className="display-heading mt-2 text-4xl">{j.job_number}</h1>
          <p className="text-sm text-muted-foreground">
            {REQUEST_TYPE_LABELS[method] ?? titleCase(method)} ·{" "}
            {j.orders ? (
              <Link
                to="/admin/requests/$kind/$id"
                params={{ kind: "order", id: j.orders.id }}
                className="text-primary hover:underline"
              >
                {j.orders.order_number}
              </Link>
            ) : (
              "—"
            )}{" "}
            · {j.orders?.contact_name ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadProductionPdf(j)}>
            Download production spec (.pdf)
          </Button>
          <Button variant="outline" disabled={downloading} onClick={async () => {
            setDownloading(true);
            try {
              await downloadProductionZip(j);
              toast.success("Production package downloaded");
            } catch (error) {
              toast.error((error as Error).message);
            } finally {
              setDownloading(false);
            }
          }}>
            {downloading ? "Building package…" : "Download production package (.zip)"}
          </Button>
          {j.orders && (
            <Button asChild variant="outline">
              <Link to="/admin/requests/$kind/$id" params={{ kind: "order", id: j.orders.id }}>
                View order
              </Link>
            </Button>
          )}
        </div>
      </div>

      <section
        className={`border-l-4 p-4 ${ready ? "border-foreground bg-secondary" : "border-primary bg-primary/5"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="display-heading text-2xl">
            {ready ? "Ready for production" : "Blocked — information missing"}
          </h2>
          <Button
            size="sm"
            disabled={!ready}
            onClick={() =>
              patch.mutate({
                is_production_ready: true,
                readiness: checks as never,
                stage: "pre_production",
              })
            }
          >
            Mark ready for production
          </Button>
        </div>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.key} className={c.ok ? "text-muted-foreground" : "font-semibold text-primary"}>
              {c.ok ? "✓" : "✕"} {c.label}
              {!c.ok && c.detail ? ` — ${c.detail}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <section className="grid gap-4">
            <h2 className="display-heading text-2xl">Approved production specification</h2>
            {items.map((item, index) => (
              <DesignSpec key={index} snapshot={item} overrides={overrideMap} />
            ))}
            {items.length === 0 && (
              <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                This job has no locked snapshot.
              </p>
            )}
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="display-heading text-2xl">
              {REQUEST_TYPE_LABELS[method] ?? titleCase(method)} details
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(METHOD_FIELDS[method] ?? []).map((field) => (
                <div key={field} className="grid gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {titleCase(field)}
                  </span>
                  <Input
                    defaultValue={j.production_data?.[field] ?? ""}
                    onBlur={(e) =>
                      patch.mutate({
                        production_data: { ...(j.production_data ?? {}), [field]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="display-heading text-2xl">Files</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Customer originals are never replaced. Prepared production files are tracked
              separately.
            </p>
            <div className="mt-3 grid gap-2 text-sm">
              {j.production_files.map((f) => (
                <div key={f.id} className="flex items-center justify-between border border-border p-2">
                  <span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      {titleCase(f.kind)}
                    </span>{" "}
                    · {f.label ?? f.storage_path}
                  </span>
                  {f.kind === "production_artwork" && (
                    <Button
                      size="sm"
                      variant={f.is_approved ? "ghost" : "outline"}
                      onClick={async () => {
                        await supabase
                          .from("production_files")
                          .update({ is_approved: !f.is_approved })
                          .eq("id", f.id);
                        void qc.invalidateQueries({ queryKey: ["job", jobId] });
                      }}
                    >
                      {f.is_approved ? "Approved" : "Approve"}
                    </Button>
                  )}
                </div>
              ))}
              {j.production_files.length === 0 && (
                <p className="text-muted-foreground">No files attached.</p>
              )}
            </div>
            <ProductionFileUpload jobId={jobId} onDone={() => qc.invalidateQueries({ queryKey: ["job", jobId] })} />
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="display-heading text-2xl">Production overrides</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The calculated value is kept. Overrides are labelled everywhere and written to the
              audit trail.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Input
                placeholder="Field (e.g. front:width_in)"
                value={override.field}
                onChange={(e) => setOverride({ ...override, field: e.target.value })}
              />
              <Input
                placeholder="New value"
                value={override.value}
                onChange={(e) => setOverride({ ...override, value: e.target.value })}
              />
              <Input
                placeholder="Reason"
                value={override.reason}
                onChange={(e) => setOverride({ ...override, reason: e.target.value })}
              />
              <Button
                onClick={async () => {
                  if (!override.field || !override.value) {
                    toast.error("Field and value are required");
                    return;
                  }
                  await supabase.from("production_overrides").insert({
                    production_job_id: jobId,
                    field_key: override.field,
                    override_value: override.value,
                    reason: override.reason || null,
                  });
                  await supabase.from("audit_log").insert({
                    entity_type: "production_jobs",
                    entity_id: jobId,
                    action: "production_override",
                    after_value: override as never,
                  });
                  setOverride({ field: "", value: "", reason: "" });
                  void qc.invalidateQueries({ queryKey: ["job", jobId] });
                }}
              >
                Add
              </Button>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              {j.production_overrides.map((o) => (
                <p key={o.id} className="border-l-2 border-primary pl-3">
                  <span className="font-semibold">{o.field_key}</span>: {o.override_value}
                  {o.calculated_value ? ` (calculated ${o.calculated_value})` : ""}{" "}
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()} {o.reason ? `· ${o.reason}` : ""}
                  </span>
                </p>
              ))}
            </div>
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="display-heading text-2xl">Quality control</h2>
            <Textarea
              className="mt-3"
              rows={2}
              value={qcNote}
              onChange={(e) => setQcNote(e.target.value)}
              placeholder="What was checked, or why it failed"
            />
            <div className="mt-2 flex gap-2">
              {(["pass", "fail"] as const).map((result) => (
                <Button
                  key={result}
                  variant={result === "pass" ? "default" : "outline"}
                  onClick={async () => {
                    if (result === "fail" && !qcNote.trim()) {
                      toast.error("A reason is required when QC fails");
                      return;
                    }
                    await supabase.from("qc_records").insert({
                      production_job_id: jobId,
                      result,
                      notes: qcNote || null,
                      reprint_required: result === "fail",
                    });
                    await patch.mutateAsync({
                      stage: result === "pass" ? "ready" : "in_production",
                    });
                    setQcNote("");
                    void qc.invalidateQueries({ queryKey: ["job", jobId] });
                  }}
                >
                  QC {result}
                </Button>
              ))}
            </div>
            <div className="mt-3 grid gap-1 text-sm">
              {j.qc_records.map((q) => (
                <p key={q.id}>
                  <span className="font-semibold uppercase">{q.result}</span> ·{" "}
                  {new Date(q.created_at).toLocaleString()} {q.notes ? `· ${q.notes}` : ""}
                </p>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid h-fit gap-4 border border-border bg-card p-4">
          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Stage
            </span>
            <select
              className="h-10 border border-border bg-background px-2 text-sm"
              value={j.stage}
              onChange={(e) =>
                patch.mutate({
                  stage: e.target.value,
                  ...(e.target.value === "in_production" ? { started_at: new Date().toISOString() } : {}),
                  ...(e.target.value === "completed" ? { completed_at: new Date().toISOString() } : {}),
                })
              }
            >
              {PRODUCTION_STAGES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Priority
            </span>
            <select
              className="h-10 border border-border bg-background px-2 text-sm"
              value={j.priority}
              onChange={(e) => patch.mutate({ priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Due date
            </span>
            <Input
              type="date"
              defaultValue={j.due_date ?? ""}
              onBlur={(e) => patch.mutate({ due_date: e.target.value })}
            />
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Production notes
            </span>
            <Textarea
              rows={4}
              defaultValue={j.notes ?? ""}
              onBlur={(e) => patch.mutate({ notes: e.target.value })}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {j.locked_at
              ? `Snapshot locked ${new Date(j.locked_at).toLocaleString()} — catalogue changes will not affect this job.`
              : "Snapshot not locked yet — it locks when the proof is approved."}
          </p>
        </aside>
      </div>
    </div>
  );
}

function ProductionFileUpload({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-dashed border-border px-3 py-2 text-sm">
      <input
        type="file"
        className="hidden"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          const path = `production/${jobId}/${crypto.randomUUID()}-${file.name}`;
          const { error } = await supabase.storage.from("artwork").upload(path, file);
          if (error) {
            toast.error(error.message);
            setBusy(false);
            return;
          }
          await supabase.from("production_files").insert({
            production_job_id: jobId,
            kind: "production_artwork",
            label: file.name,
            storage_path: path,
          });
          setBusy(false);
          toast.success("Production file added");
          onDone();
        }}
      />
      {busy ? "Uploading…" : "Upload prepared production file"}
    </label>
  );
}
