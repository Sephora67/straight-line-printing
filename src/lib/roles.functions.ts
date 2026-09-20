import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Claim the Owner role for the current signed-in user when no owner exists yet.
 * The database function is only executable by the service role, so the claim
 * always goes through this server-verified path — never directly from the browser.
 */
export const claimOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("claim_owner_for_user", {
      _user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { claimed: Boolean(data) };
  });
