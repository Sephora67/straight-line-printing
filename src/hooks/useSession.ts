import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}

export function useRoles() {
  const { session, loading } = useSession();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }
    let active = true;
    supabase.rpc("current_user_roles").then(({ data }) => {
      if (!active) return;
      setRoles((data ?? []) as AppRole[]);
      setRolesLoading(false);
    });
    return () => {
      active = false;
    };
  }, [session, loading]);

  const isStaff = roles.length > 0;
  const isAdmin = roles.includes("owner") || roles.includes("administrator");
  return { roles, isStaff, isAdmin, loading: loading || rolesLoading, session };
}
