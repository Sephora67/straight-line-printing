import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("current_user_permissions");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export async function requirePermission(
  context: { supabase: typeof import("@/integrations/supabase/client").supabase; userId: string },
  permission: string,
) {
  const { data, error } = await context.supabase.rpc("current_user_permissions");
  if (error) throw new Error(error.message);
  if (!(data ?? []).includes(permission)) throw new Error("You do not have permission for this action.");
}