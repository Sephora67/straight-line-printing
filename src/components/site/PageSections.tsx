import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  SECTION_LIBRARY,
  fetchSections,
  sectionsQueryKey,
  type SectionContent,
  type SectionType,
  type SiteSection,
} from "@/lib/site-content";
import { DEFAULT_SECTIONS } from "@/lib/site-defaults";
import { SectionEditProvider, useSiteEditor } from "@/components/site/editor/SiteEditor";
import { SectionView } from "@/components/site/sections/SectionView";

function defaultsFor(slug: string): SiteSection[] {
  return (DEFAULT_SECTIONS[slug] ?? []).map((s, i) => ({
    id: `default-${slug}-${i}`,
    page_slug: slug,
    type: s.type,
    sort_order: i,
    is_visible: true,
    content: s.content,
  }));
}

export function PageSections({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const { editing, canEdit } = useSiteEditor();
  const [busy, setBusy] = useState(false);
  const materialising = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: sectionsQueryKey(slug),
    queryFn: () => fetchSections(slug),
    staleTime: 30_000,
  });

  const stored = data ?? [];
  const isVirtual = stored.length === 0;
  const sections = useMemo(
    () => (isVirtual ? defaultsFor(slug) : stored),
    [isVirtual, slug, stored],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: sectionsQueryKey(slug) });

  /* Copy the built-in page content into the database the first time staff edit it. */
  useEffect(() => {
    if (!editing || !canEdit || isLoading || !isVirtual || materialising.current) return;
    const rows = defaultsFor(slug);
    if (rows.length === 0) return;
    materialising.current = true;
    void (async () => {
      const { error } = await supabase.from("site_sections").insert(
        rows.map((r) => ({
          page_slug: r.page_slug,
          type: r.type,
          sort_order: r.sort_order,
          is_visible: r.is_visible,
          content: r.content as never,
        })),
      );
      if (error) toast.error(error.message);
      await invalidate();
      materialising.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, canEdit, isLoading, isVirtual, slug]);

  const saveContent = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: SectionContent }) => {
      const { error } = await supabase
        .from("site_sections")
        .update({ content: content as never })
        .eq("id", id);
      if (error) throw error;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function run(fn: () => Promise<{ error: { message: string } | null }>) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await invalidate();
  }

  async function addSection(type: SectionType, index: number) {
    const blank = SECTION_LIBRARY.find((s) => s.type === type)?.blank ?? {};
    await run(async () => {
      const { error } = await supabase.from("site_sections").insert({
        page_slug: slug,
        type,
        sort_order: index,
        is_visible: true,
        content: blank as never,
      });
      if (error) return { error };
      // renumber
      const rows = [...sections];
      const reordered = [
        ...rows.slice(0, index).map((r, i) => ({ id: r.id, sort_order: i })),
        ...rows.slice(index).map((r, i) => ({ id: r.id, sort_order: index + i + 1 })),
      ];
      for (const r of reordered) {
        await supabase.from("site_sections").update({ sort_order: r.sort_order }).eq("id", r.id);
      }
      return { error: null };
    });
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const a = sections[index];
    const b = sections[target];
    if (!a || !b) return;
    await run(async () => {
      const r1 = await supabase.from("site_sections").update({ sort_order: b.sort_order }).eq("id", a.id);
      if (r1.error) return { error: r1.error };
      return await supabase.from("site_sections").update({ sort_order: a.sort_order }).eq("id", b.id);
    });
  }

  const publicSections = sections.filter((s) => s.is_visible);
  const visible = editing ? sections : publicSections;

  return (
    <div>
      {editing && (
        <AddSectionBar onAdd={(type) => addSection(type, 0)} disabled={busy} label="Add a section at the top" />
      )}
      {visible.map((section, index) => (
        <div key={section.id} className="contents">
          <SectionEditProvider
            editing={editing}
            content={section.content}
            onChange={(next) => {
              queryClient.setQueryData<SiteSection[]>(sectionsQueryKey(slug), (old) =>
                (old ?? []).map((s) => (s.id === section.id ? { ...s, content: next } : s)),
              );
              if (!section.id.startsWith("default-")) {
                saveContent.mutate({ id: section.id, content: next });
              }
            }}
          >
            <div
              className={cn(
                "relative",
                editing && "outline-dashed outline-1 outline-border",
                editing && !section.is_visible && "opacity-40",
              )}
            >
              {editing && (
                <div className="absolute right-2 top-2 z-40 flex items-center gap-1 rounded bg-ink/90 p-1 text-ink-foreground shadow">
                  <span className="px-2 text-[10px] uppercase tracking-widest opacity-70">
                    {SECTION_LIBRARY.find((s) => s.type === section.type)?.label ?? section.type}
                  </span>
                  <IconBtn label="Move up" disabled={busy || index === 0} onClick={() => move(index, -1)}>
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Move down"
                    disabled={busy || index === visible.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label={section.is_visible ? "Hide" : "Show"}
                    disabled={busy}
                    onClick={() =>
                      run(async () =>
                        supabase
                          .from("site_sections")
                          .update({ is_visible: !section.is_visible })
                          .eq("id", section.id),
                      )
                    }
                  >
                    {section.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </IconBtn>
                  <IconBtn
                    label="Duplicate"
                    disabled={busy}
                    onClick={() =>
                      run(async () =>
                        supabase.from("site_sections").insert({
                          page_slug: slug,
                          type: section.type,
                          sort_order: section.sort_order + 1,
                          is_visible: section.is_visible,
                          content: section.content as never,
                        }),
                      )
                    }
                  >
                    <Copy className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Delete section"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm("Remove this section from the page?")) return;
                      void run(async () =>
                        supabase.from("site_sections").delete().eq("id", section.id),
                      );
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              )}
              <SectionView section={section} />
            </div>
          </SectionEditProvider>
          {editing && (
            <AddSectionBar
              onAdd={(type) => addSection(type, index + 1)}
              disabled={busy}
              label="Add a section here"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded hover:bg-steel disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function AddSectionBar({
  onAdd,
  disabled,
  label,
}: {
  onAdd: (type: SectionType) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex justify-center bg-secondary/60 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Plus className="size-4" /> {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-80 overflow-y-auto">
          {SECTION_LIBRARY.map((s) => (
            <DropdownMenuItem key={s.type} onSelect={() => onAdd(s.type)}>
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
