import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/lib/permissions.functions";

export const getNotificationAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "notifications.view");
    const [{ data: settings, error: settingsError }, { data: templates, error: templatesError }] = await Promise.all([
      context.supabase.from("notification_settings").select("*").eq("id", "default").single(),
      context.supabase.from("notification_templates").select("*").order("category").order("name"),
    ]);
    if (settingsError) throw new Error(settingsError.message);
    if (templatesError) throw new Error(templatesError.message);
    return { settings, templates: templates ?? [] };
  });

export const updateNotificationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    admin_email: z.string().email().nullable(), reply_to_email: z.string().email().nullable(), sender_name: z.string().min(1).max(100),
    contact_enabled: z.boolean(), internal_notifications_enabled: z.boolean(), order_confirmation_enabled: z.boolean(), order_status_enabled: z.boolean(), production_status_enabled: z.boolean(), quote_enabled: z.boolean(), shipping_enabled: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "notifications.edit");
    const { error } = await context.supabase.from("notification_settings").update({ ...data, updated_by: context.userId }).eq("id", "default");
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({ user_id: context.userId, entity_type: "notification_settings", action: "notification_settings_updated", after_value: data });
    return { ok: true };
  });

export const updateNotificationTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), subject: z.string().min(1).max(200), title: z.string().min(1).max(200), body: z.string().min(1).max(10000), is_active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "notifications.templates.edit");
    const { id, ...changes } = data;
    const { error } = await context.supabase.from("notification_templates").update({ ...changes, updated_by: context.userId }).eq("id", id);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({ user_id: context.userId, entity_type: "notification_templates", entity_id: id, action: "notification_template_updated", after_value: changes });
    return { ok: true };
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "audit.view");
    const { data, error } = await context.supabase.from("audit_log").select("id,user_id,entity_type,entity_id,action,before_value,after_value,created_at").order("created_at", { ascending: false }).limit(250);
    if (error) throw new Error(error.message);
    const userIds = [...new Set((data ?? []).map((entry) => entry.user_id).filter((id): id is string => Boolean(id)))];
    const { data: profiles, error: profileError } = userIds.length
      ? await context.supabase.from("profiles").select("id,email,full_name").in("id", userIds)
      : { data: [], error: null };
    if (profileError) throw new Error(profileError.message);
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return (data ?? []).map((entry) => ({ ...entry, profile: entry.user_id ? profileMap.get(entry.user_id) ?? null : null }));
  });