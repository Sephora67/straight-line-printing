import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { fetchPageRoutes, pageRoutesQueryKey } from "@/lib/site-content";

export function PageRouteGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data = [], isLoading } = useQuery({ queryKey: pageRoutesQueryKey, queryFn: fetchPageRoutes, staleTime: 30_000 });
  const managed = data.find((page) => page.original_path === pathname);

  useEffect(() => {
    if (managed?.is_published && managed.current_path !== pathname) window.location.replace(managed.current_path);
  }, [managed, pathname]);

  if (isLoading || (managed?.is_published && managed.current_path !== pathname)) return null;
  if (managed && !managed.is_published) {
    return (
      <div className="section-shell py-24 text-center">
        <h1 className="display-heading text-5xl">Page unavailable</h1>
        <p className="mt-3 text-muted-foreground">This page is not currently published.</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Go home</a>
      </div>
    );
  }
  return children;
}