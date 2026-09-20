import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getNotificationAdmin, updateNotificationSettings, updateNotificationTemplate } from "@/lib/notifications.functions";
import { titleCase } from "@/lib/production-spec";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({ meta: [{ title: "Email & Notifications | Straight Line Printing" }, { name: "description", content: "Manage customer email settings and wording." }, { property: "og:title", content: "Email & Notifications | Straight Line Printing" }, { property: "og:description", content: "Manage customer email settings and wording." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const getAdmin = useServerFn(getNotificationAdmin);
  const query = useQuery({ queryKey: ["notification-admin"], queryFn: () => getAdmin() });
  return <div className="grid gap-8"><div><h1 className="display-heading text-4xl">Email &amp; notifications</h1><p className="mt-2 text-sm text-muted-foreground">Control event emails and the exact customer-facing wording.</p></div><div className="border-l-4 border-primary bg-primary/5 p-4 text-sm">Templates and settings are ready. Live delivery remains paused until your business sender domain is connected.</div>{query.data && <><SettingsForm settings={query.data.settings}/><div className="grid gap-4"><h2 className="display-heading text-2xl">Templates</h2>{query.data.templates.map((template) => <TemplateForm key={template.id} template={template}/>)}</div></>}</div>;
}

function SettingsForm({ settings }: { settings: Awaited<ReturnType<typeof getNotificationAdmin>>["settings"] }) {
  const save = useServerFn(updateNotificationSettings); const qc = useQueryClient(); const [value, setValue] = useState(settings);
  const toggles = ["contact_enabled","internal_notifications_enabled","order_confirmation_enabled","order_status_enabled","production_status_enabled","quote_enabled","shipping_enabled"] as const;
  return <section className="border border-border bg-card p-5"><h2 className="display-heading text-2xl">Settings</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Input value={value.sender_name} onChange={(e) => setValue({ ...value, sender_name: e.target.value })} placeholder="Sender name"/><Input type="email" value={value.reply_to_email ?? ""} onChange={(e) => setValue({ ...value, reply_to_email: e.target.value || null })} placeholder="Reply-to email"/><Input type="email" value={value.admin_email ?? ""} onChange={(e) => setValue({ ...value, admin_email: e.target.value || null })} placeholder="Admin notification email"/></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{toggles.map((key) => <label key={key} className="flex items-center justify-between border border-border p-3 text-sm"><span>{titleCase(key.replace("_enabled", ""))}</span><Switch checked={value[key]} onCheckedChange={(checked) => setValue({ ...value, [key]: checked })}/></label>)}</div><Button className="mt-4" onClick={async () => { try { await save({ data: { admin_email: value.admin_email, reply_to_email: value.reply_to_email, sender_name: value.sender_name, contact_enabled: value.contact_enabled, internal_notifications_enabled: value.internal_notifications_enabled, order_confirmation_enabled: value.order_confirmation_enabled, order_status_enabled: value.order_status_enabled, production_status_enabled: value.production_status_enabled, quote_enabled: value.quote_enabled, shipping_enabled: value.shipping_enabled } }); toast.success("Notification settings saved"); void qc.invalidateQueries({ queryKey: ["notification-admin"] }); } catch (error) { toast.error((error as Error).message); } }}>Save settings</Button></section>;
}

function TemplateForm({ template }: { template: Awaited<ReturnType<typeof getNotificationAdmin>>["templates"][number] }) {
  const save = useServerFn(updateNotificationTemplate); const [value, setValue] = useState(template); const [open, setOpen] = useState(false);
  return <section className="border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">{titleCase(template.category)} · {titleCase(template.audience)}</p><h3 className="font-semibold">{template.name}</h3></div><div className="flex items-center gap-3"><Switch checked={value.is_active} onCheckedChange={(checked) => setValue({ ...value, is_active: checked })}/><Button variant="outline" size="sm" onClick={() => setOpen(!open)}>{open ? "Close" : "Edit"}</Button></div></div>{open && <div className="mt-4 grid gap-3"><Input value={value.subject} onChange={(e) => setValue({ ...value, subject: e.target.value })}/><Input value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })}/><Textarea rows={7} value={value.body} onChange={(e) => setValue({ ...value, body: e.target.value })}/><p className="text-xs text-muted-foreground">Available: {value.available_variables.map((item) => `{{${item}}}`).join(", ")}</p><Button className="w-fit" onClick={async () => { try { await save({ data: { id: value.id, subject: value.subject, title: value.title, body: value.body, is_active: value.is_active } }); toast.success("Template saved"); } catch (error) { toast.error((error as Error).message); } }}>Save template</Button></div>}</section>;
}