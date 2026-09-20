import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  REQUEST_TYPE_LABELS,
  titleCase,
} from "@/lib/production-spec";

export const Route = createFileRoute("/_authenticated/admin/inbox")({
  component: Inbox,
});

type Row = {
  kind: "quote" | "order";
  id: string;
  number: string;
  customer: string;
  email: string;
  type: string;
  status: string;
  payment: string | null;
  priority: string;
  due: string | null;
  created: string;
  items: number;
  jobs: number;
};

function Inbox() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const data = useQuery({
    queryKey: ["admin-inbox"],
    queryFn: async (): Promise<Row[]> => {
      const [quotes, orders] = await Promise.all([
        supabase
          .from("quotes")
          .select(
            "id, quote_number, contact_name, contact_email, status, request_type, priority, deadline, created_at, quote_items(id)",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select(
            "id, order_number, contact_name, contact_email, status, request_type, priority, payment_status, due_date, created_at, order_items(id), production_jobs(id)",
          )
          .order("created_at", { ascending: false }),
      ]);
      const rows: Row[] = [];
      for (const qt of quotes.data ?? []) {
        rows.push({
          kind: "quote",
          id: qt.id,
          number: qt.quote_number,
          customer: qt.contact_name ?? "—",
          email: qt.contact_email ?? "—",
          type: qt.request_type ?? "quote",
          status: qt.status ?? "new",
          payment: null,
          priority: qt.priority ?? "normal",
          due: qt.deadline,
          created: qt.created_at,
          items: qt.quote_items?.length ?? 0,
          jobs: 0,
        });
      }
      for (const o of orders.data ?? []) {
        rows.push({
          kind: "order",
          id: o.id,
          number: o.order_number,
          customer: o.contact_name ?? "—",
          email: o.contact_email ?? "—",
          type: o.request_type ?? "order",
          status: o.status ?? "pending",
          payment: o.payment_status ?? null,
          priority: o.priority ?? "normal",
          due: o.due_date,
          created: o.created_at,
          items: o.order_items?.length ?? 0,
          jobs: o.production_jobs?.length ?? 0,
        });
      }
      return rows.sort((a, b) => (a.created < b.created ? 1 : -1));
    },
  });

  const rows = data.data ?? [];
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (type !== "all" && r.type !== type) return false;
        if (status !== "all" && r.status !== status) return false;
        if (priority !== "all" && r.priority !== priority) return false;
        if (q) {
          const hay = `${r.number} ${r.customer} ${r.email}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [rows, q, type, status, priority],
  );

  const types = [...new Set(rows.map((r) => r.type))];
  const statuses = [...new Set(rows.map((r) => r.status))];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-heading text-4xl">Order &amp; request inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every customer order, quote and custom project in one queue.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} shown</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Search number, name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Picker value={type} onChange={setType} options={types} label="type" render={(t) => REQUEST_TYPE_LABELS[t] ?? titleCase(t)} />
        <Picker value={status} onChange={setStatus} options={statuses} label="status" render={titleCase} />
        <Picker value={priority} onChange={setPriority} options={["low", "normal", "high", "rush"]} label="priority" render={titleCase} />
      </div>

      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-widest">
            <tr>
              <th className="p-3">Number</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Due</th>
              <th className="p-3">Items</th>
              <th className="p-3">Jobs</th>
            </tr>
          </thead>
          <tbody>
            {data.isLoading && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={8}>
                  Loading…
                </td>
              </tr>
            )}
            {!data.isLoading && filtered.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={8}>
                  Nothing here yet. Customer requests and orders appear automatically.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={`${r.kind}-${r.id}`} className="border-t border-border hover:bg-secondary/50">
                <td className="p-3 font-mono text-xs">
                  <Link
                    to="/admin/requests/$kind/$id"
                    params={{ kind: r.kind, id: r.id }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {r.number}
                  </Link>
                  {r.priority !== "normal" && (
                    <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                      {r.priority}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <p className="font-semibold">{r.customer}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </td>
                <td className="p-3">{REQUEST_TYPE_LABELS[r.type] ?? titleCase(r.type)}</td>
                <td className="p-3">{titleCase(r.status)}</td>
                <td className="p-3">{r.payment ? titleCase(r.payment) : "—"}</td>
                <td className="p-3">{r.due ?? "—"}</td>
                <td className="p-3">{r.items}</td>
                <td className="p-3">{r.jobs || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
  label,
  render,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
  render: (v: string) => string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Filter by ${label}`}
      className="h-10 border border-border bg-background px-3 text-sm"
    >
      <option value="all">All {label}s</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {render(o)}
        </option>
      ))}
    </select>
  );
}
