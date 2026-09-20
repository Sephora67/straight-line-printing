import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listActivity } from "@/lib/notifications.functions";
import { titleCase } from "@/lib/production-spec";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  head: () => ({ meta: [{ title: "Activity | Straight Line Printing" }, { name: "description", content: "Review administrative and production activity." }, { property: "og:title", content: "Activity | Straight Line Printing" }, { property: "og:description", content: "Review administrative and production activity." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ActivityPage,
});

function ActivityPage() { const list = useServerFn(listActivity); const activity = useQuery({ queryKey: ["activity"], queryFn: () => list() }); return <div><h1 className="display-heading text-4xl">Activity</h1><p className="mt-2 text-sm text-muted-foreground">The latest employee and system changes.</p><div className="mt-6 grid gap-2">{(activity.data ?? []).map((entry) => { const profile = entry.profile; return <div key={entry.id} className="grid gap-1 border border-border bg-card p-3 sm:grid-cols-[12rem_1fr_12rem]"><span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span><span className="text-sm"><strong>{titleCase(entry.action)}</strong> · {titleCase(entry.entity_type)}</span><span className="text-xs text-muted-foreground">{profile?.full_name ?? profile?.email ?? "System"}</span></div>; })}</div></div>; }