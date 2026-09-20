import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/lib/permissions.functions";

const roleSchema = z.enum([
  "owner",
  "administrator",
  "manager",
  "production",
  "sales",
  "designer",
  "customer_service",
]);

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "employees.view");
    const [
      { data: roles, error: rolesError },
      { data: profiles, error: profilesError },
      { data: invitations, error: inviteError },
      { data: permissions, error: permissionError },
      { data: overrides, error: overrideError },
      { data: rolePermissions, error: rolePermissionError },
    ] = await Promise.all([
      context.supabase.from("user_roles").select("id,user_id,role,created_at").order("created_at"),
      context.supabase.from("profiles").select("id,email,full_name,employee_status,last_login_at"),
      context.supabase.from("employee_invitations").select("*").order("created_at", { ascending: false }),
      context.supabase.from("permissions").select("id,code,name,description,area").order("area").order("name"),
      context.supabase.from("user_permissions").select("user_id,permission_id,granted"),
      context.supabase.from("role_permissions").select("role,permission_id"),
    ]);
    if (rolesError) throw new Error(rolesError.message);
    if (profilesError) throw new Error(profilesError.message);
    if (inviteError) throw new Error(inviteError.message);
    if (permissionError) throw new Error(permissionError.message);
    if (overrideError) throw new Error(overrideError.message);
    if (rolePermissionError) throw new Error(rolePermissionError.message);
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return {
      employees: (roles ?? []).map((role) => ({
        ...role,
        profile: profileMap.get(role.user_id) ?? null,
        overrides: (overrides ?? []).filter((item) => item.user_id === role.user_id),
      })),
      invitations: invitations ?? [],
      permissions: permissions ?? [],
      rolePermissions: rolePermissions ?? [],
    };
  });

export const inviteEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ email: z.string().email(), fullName: z.string().trim().min(1).max(120), role: roleSchema })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "employees.add");
    const email = data.email.toLowerCase();
    if (data.role === "owner") await requirePermission(context, "employees.permissions");

    // Existing account? Grant staff access immediately.
    const { data: existing, error: lookupError } = await context.supabase
      .from("profiles")
      .select("id,email")
      .ilike("email", email)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    if (existing) {
      const { error: roleError } = await context.supabase
        .from("user_roles")
        .upsert({ user_id: existing.id, role: data.role }, { onConflict: "user_id,role" });
      if (roleError) throw new Error(roleError.message);
      const { error: profileError } = await context.supabase
        .from("profiles")
        .update({ employee_status: "active", full_name: data.fullName })
        .eq("id", existing.id);
      if (profileError) throw new Error(profileError.message);
      await context.supabase.from("audit_log").insert({
        user_id: context.userId,
        entity_type: "employees",
        entity_id: existing.id,
        action: "employee_added_existing_account",
        after_value: { email, role: data.role },
      });
      return { ok: true, activated: true as const, email };
    }

    const { error } = await context.supabase.from("employee_invitations").insert({
      email,
      full_name: data.fullName,
      role: data.role,
      invited_by: context.userId,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      user_id: context.userId,
      entity_type: "employees",
      action: "employee_invited",
      after_value: { email, role: data.role },
    });
    return { ok: true, activated: false as const, email };
  });

export const updateInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ invitationId: z.string().uuid(), action: z.enum(["revoke", "extend"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "employees.add");
    const patch =
      data.action === "revoke"
        ? { status: "revoked" }
        : { status: "pending", expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString() };
    const { error } = await context.supabase
      .from("employee_invitations")
      .update(patch)
      .eq("id", data.invitationId);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      user_id: context.userId,
      entity_type: "employees",
      entity_id: data.invitationId,
      action: `employee_invitation_${data.action}`,
      after_value: patch,
    });
    return { ok: true };
  });

export const updateEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        role: roleSchema,
        status: z.enum(["active", "inactive"]),
        overrides: z.array(z.object({ permissionId: z.string().uuid(), granted: z.boolean() })).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "employees.edit");
    if (data.role === "owner") await requirePermission(context, "employees.permissions");

    const { data: currentRoles, error: currentError } = await context.supabase
      .from("user_roles")
      .select("id,role")
      .eq("user_id", data.userId);
    if (currentError) throw new Error(currentError.message);

    if (!(currentRoles ?? []).some((row) => row.role === data.role)) {
      const { error: insertError } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (insertError) throw new Error(insertError.message);
    }
    const stale = (currentRoles ?? []).filter((row) => row.role !== data.role).map((row) => row.id);
    if (stale.length) {
      const { error: deleteError } = await context.supabase.from("user_roles").delete().in("id", stale);
      if (deleteError) throw new Error(deleteError.message);
    }

    const { error: profileError } = await context.supabase
      .from("profiles")
      .update({ employee_status: data.status })
      .eq("id", data.userId);
    if (profileError) throw new Error(profileError.message);

    if (data.overrides) {
      await requirePermission(context, "employees.permissions");
      const { error: clearError } = await context.supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", data.userId);
      if (clearError) throw new Error(clearError.message);
      if (data.overrides.length) {
        const { error: overrideError } = await context.supabase.from("user_permissions").insert(
          data.overrides.map((item) => ({
            user_id: data.userId,
            permission_id: item.permissionId,
            granted: item.granted,
          })),
        );
        if (overrideError) throw new Error(overrideError.message);
      }
    }

    await context.supabase.from("audit_log").insert({
      user_id: context.userId,
      entity_type: "employees",
      entity_id: data.userId,
      action: "employee_updated",
      after_value: { role: data.role, status: data.status, overrides: data.overrides ?? null },
    });
    return { ok: true };
  });
