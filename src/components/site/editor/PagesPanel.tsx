import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchPages, pagesQueryKey, type SitePage } from "@/lib/site-content";

const CODE_CONTENT_PATHS = new Set(["/", "/custom-apparel", "/screen-printing", "/dtf-printing", "/dtf-transfers", "/embroidery", "/how-it-works", "/print-on-demand", "/about", "/faq", "/contact"]);

export function PagesPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: pagesQueryKey, queryFn: fetchPages, staleTime: 10_000 });
  const [editing, setEditing] = useState<SitePage | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: pagesQueryKey });
  }

  async function patch(id: string, values: Partial<SitePage>) {
    setBusy(true);
    const { error } = await supabase.from("site_pages").update(values).eq("id", id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const other = data[index + direction];
    const page = data[index];
    if (!page || !other) return;
    setBusy(true);
    const first = await supabase.from("site_pages").update({ nav_order: other.nav_order }).eq("id", page.id);
    const second = first.error ? first : await supabase.from("site_pages").update({ nav_order: page.nav_order }).eq("id", other.id);
    setBusy(false);
    if (second.error) {
      toast.error(second.error.message);
      return;
    }
    await refresh();
  }

  async function remove(page: SitePage) {
    if (!window.confirm(`Permanently delete “${page.title}” and all of its content?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("delete_site_page", { _page_id: page.id });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Page permanently deleted");
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader><SheetTitle>Pages & navigation</SheetTitle></SheetHeader>
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Manage public pages and their menu order.</p>
            <Button size="sm" onClick={() => setEditing("new")}><FilePlus2 className="size-4" /> Add page</Button>
          </div>
          <div className="mt-5 divide-y border-y border-border">
            {isLoading && <p className="py-6 text-sm text-muted-foreground">Loading pages…</p>}
            {data.map((page, index) => (
              <div key={page.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{page.title}</span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{page.page_kind === "system" ? "Protected" : page.is_published ? "Published" : "Archived"}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{page.path}</p>
                  <label className="mt-2 flex items-center gap-2 text-xs">
                    <Switch checked={page.show_in_nav} disabled={busy} onCheckedChange={(value) => void patch(page.id, { show_in_nav: value })} />
                    Show in navigation
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" title="Move up" disabled={busy || index === 0} onClick={() => void move(index, -1)}><ArrowUp className="size-4" /></Button>
                  <Button variant="ghost" size="icon" title="Move down" disabled={busy || index === data.length - 1} onClick={() => void move(index, 1)}><ArrowDown className="size-4" /></Button>
                  <Button variant="ghost" size="icon" title="Edit page" onClick={() => setEditing(page)}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" title={page.is_protected ? "Protected pages stay published" : page.is_published ? "Archive page" : "Publish page"} disabled={busy || page.is_protected} onClick={() => void patch(page.id, { is_published: !page.is_published })}>
                    {page.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  {!page.is_protected && !CODE_CONTENT_PATHS.has(page.original_path) && <Button variant="ghost" size="icon" title="Permanently delete" disabled={busy} onClick={() => void remove(page)}><Trash2 className="size-4" /></Button>}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      <PageDialog page={editing} onClose={() => setEditing(null)} onSaved={async (path) => { setEditing(null); await refresh(); onOpenChange(false); window.location.assign(path); }} />
    </>
  );
}

function PageDialog({ page, onClose, onSaved }: { page: SitePage | "new" | null; onClose: () => void; onSaved: (path: string) => void }) {
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!page || page === "new") { setTitle(""); setPath(""); setNavLabel(""); setMetaTitle(""); setDescription(""); return; }
    setTitle(page.title); setPath(page.path); setNavLabel(page.nav_label); setMetaTitle(page.meta_title); setDescription(page.meta_description);
  }, [page]);

  const protectedUrl = page !== null && page !== "new" && page.is_protected;
  async function save() {
    if (!title.trim() || !path.trim()) {
      toast.error("Add a page name and URL");
      return;
    }
    setSaving(true);
    if (page === "new") {
      const result = await supabase.rpc("create_site_page", { _title: title, _path: path, _meta_description: description });
      setSaving(false);
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      const created = result.data as unknown as SitePage;
      toast.success("Page created");
      onSaved(created.path);
      return;
    }
    if (!page) return;
    const result = await supabase.rpc("rename_site_page", { _page_id: page.id, _title: title, _path: path, _nav_label: navLabel || title, _meta_title: metaTitle || `${title} | Straight Line Printing`, _meta_description: description });
    setSaving(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    const updated = result.data as unknown as SitePage;
    toast.success("Page saved");
    onSaved(updated.path);
  }

  return (
    <Dialog open={page !== null} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{page === "new" ? "Add page" : "Page settings"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <Field label="Page name"><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field label="URL"><Input value={path} disabled={protectedUrl} onChange={(event) => setPath(event.target.value)} placeholder="team-apparel" /></Field>
          {page !== "new" && <Field label="Navigation label"><Input value={navLabel} onChange={(event) => setNavLabel(event.target.value)} /></Field>}
          {page !== "new" && <Field label="Browser and sharing title"><Input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} /></Field>}
          <Field label="Page description"><Input value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save page"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}