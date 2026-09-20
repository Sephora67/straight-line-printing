import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyPermissions } from "@/lib/permissions.functions";
import { useSession } from "@/hooks/useSession";

export function usePermissions() {
  const { session, loading } = useSession();
  const getPermissions = useServerFn(getMyPermissions);
  const query = useQuery({
    queryKey: ["my-permissions", session?.user.id ?? "anonymous"],
    queryFn: () => getPermissions(),
    enabled: Boolean(session) && !loading,
    staleTime: 60_000,
  });
  return {
    ...query,
    loading: loading || (Boolean(session) && query.isPending),
    can: (permission: string) => (query.data ?? []).includes(permission),
  };
}
