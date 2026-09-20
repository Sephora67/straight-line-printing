import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSiteEditor } from "@/components/site/editor/SiteEditor";

export type CopyEntry = { id: string; fallback: string };

export const copyQueryKey = ["site_copy"] as const;

export async function fetchCopy(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("site_copy").select("key,value");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

type Ctx = {
  map: Record<string, string>;
  entries: CopyEntry[];
  register: (id: string, fallback: string) => void;
  save: (id: string, value: string, fallback: string) => Promise<void>;
};

const CopyContext = createContext<Ctx>({
  map: {},
  entries: [],
  register: () => {},
  save: async () => {},
});

export function SiteCopyProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useQuery({ queryKey: copyQueryKey, queryFn: fetchCopy, staleTime: 60_000 });
  const [entries, setEntries] = useState<CopyEntry[]>([]);
  const known = useRef(new Set<string>());

  useEffect(() => {
    known.current = new Set();
    setEntries([]);
  }, [pathname]);

  const register = useCallback((id: string, fallback: string) => {
    if (known.current.has(id)) return;
    known.current.add(id);
    setEntries((prev) => [...prev, { id, fallback }]);
  }, []);

  const save = useCallback(
    async (id: string, value: string, fallback: string) => {
      const trimmed = value.trim();
      queryClient.setQueryData<Record<string, string>>(copyQueryKey, (old) => {
        const next = { ...(old ?? {}) };
        if (!trimmed || trimmed === fallback) delete next[id];
        else next[id] = trimmed;
        return next;
      });
      const { error } =
        !trimmed || trimmed === fallback
          ? await supabase.from("site_copy").delete().eq("key", id)
          : await supabase.from("site_copy").upsert({ key: id, value: trimmed });
      if (error) {
        toast.error(error.message);
        await queryClient.invalidateQueries({ queryKey: copyQueryKey });
      }
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ map: data ?? {}, entries, register, save }),
    [data, entries, register, save],
  );

  return <CopyContext.Provider value={value}>{children}</CopyContext.Provider>;
}

export function useSiteCopy() {
  return useContext(CopyContext);
}

/** Returns the current wording for a key, registering it so staff can edit it. */
export function useCopyText(id: string, fallback: string): string {
  const { map, register } = useSiteCopy();
  useEffect(() => {
    register(id, fallback);
  }, [id, fallback, register]);
  return map[id] ?? fallback;
}

/**
 * Inline-editable wording on pages that are not built from CMS sections.
 * The layout stays fixed; only the words change.
 */
export function Copy({
  id,
  children,
  as = "span",
  className,
}: {
  id: string;
  /** The built-in wording, used until staff change it. */
  children: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div" | "label";
  className?: string;
}) {
  const { map, register, save } = useSiteCopy();
  const { editing } = useSiteEditor();
  const text = map[id] ?? children;
  const Tag = as as "span";

  useEffect(() => {
    register(id, children);
  }, [id, children, register]);

  if (!editing) return <Tag className={className}>{text}</Tag>;

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      data-site-editable="true"
      title="Click to change this wording"
      onBlur={(e) => {
        const next = e.currentTarget.innerText.replace(/\u00a0/g, " ");
        if (next !== text) void save(id, next, children);
      }}
      className={cn(
        "cursor-text rounded outline-none ring-offset-2 focus:ring-2 focus:ring-primary hover:bg-primary/10",
        className,
      )}
    >
      {text}
    </Tag>
  );
}
