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
import {
  Image as ImageIcon,
  Link2,
  Plus,
  Repeat,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getAtPath, setAtPath, videoEmbedUrl, type SectionContent } from "@/lib/site-content";

/* ------------------------------------------------------------------ */
/* Global edit-mode context                                            */
/* ------------------------------------------------------------------ */

type EditorCtx = {
  canEdit: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
};

const EditorContext = createContext<EditorCtx>({
  canEdit: false,
  editing: false,
  setEditing: () => {},
});

export function SiteEditorProvider({
  canEdit,
  children,
}: {
  canEdit: boolean;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const value = useMemo(
    () => ({ canEdit, editing: canEdit && editing, setEditing }),
    [canEdit, editing],
  );
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useSiteEditor() {
  return useContext(EditorContext);
}

/* ------------------------------------------------------------------ */
/* Per-section context                                                 */
/* ------------------------------------------------------------------ */

type SectionCtx = {
  editing: boolean;
  content: SectionContent;
  update: (path: (string | number)[], value: unknown) => void;
};

const SectionContext = createContext<SectionCtx>({
  editing: false,
  content: {},
  update: () => {},
});

export function SectionEditProvider({
  editing,
  content,
  onChange,
  children,
}: {
  editing: boolean;
  content: SectionContent;
  onChange: (next: SectionContent) => void;
  children: ReactNode;
}) {
  const latest = useRef(content);
  latest.current = content;

  const update = useCallback(
    (path: (string | number)[], value: unknown) => {
      onChange(setAtPath(latest.current, path, value));
    },
    [onChange],
  );

  const value = useMemo(() => ({ editing, content, update }), [editing, content, update]);
  return <SectionContext.Provider value={value}>{children}</SectionContext.Provider>;
}

export function useSection() {
  return useContext(SectionContext);
}

export function useValue<T>(path: (string | number)[], fallback: T): T {
  const { content } = useSection();
  const value = getAtPath(content, path);
  return (value === undefined || value === null ? fallback : value) as T;
}

/* ------------------------------------------------------------------ */
/* Inline editable text                                                */
/* ------------------------------------------------------------------ */

const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "BR", "SPAN"]);

/** Keep only simple inline formatting (bold / italic / underline / colour). */
export function sanitizeRichHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  const walk = (node: Element) => {
    Array.from(node.children).forEach((child) => {
      walk(child);
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }
      const el = child as HTMLElement;
      const color = el.style.color;
      const weight = el.style.fontWeight;
      const style = el.style.fontStyle;
      const deco = el.style.textDecoration || el.style.textDecorationLine;
      Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
      let css = "";
      if (color) css += `color:${color};`;
      if (weight) css += `font-weight:${weight};`;
      if (style && style !== "normal") css += `font-style:${style};`;
      if (deco && deco !== "none") css += `text-decoration:${deco};`;
      if (css) el.setAttribute("style", css);
    });
  };
  walk(root);
  return root.innerHTML;
}

/** Defensive strip for rendering (also runs during SSR). */
function renderSafeHtml(html: string): string {
  return html
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

const isRichHtml = (value: string) => /<(b|strong|i|em|u|br|span)\b[^>]*>/i.test(value);

export function EditableText({
  path,
  className,
  as = "span",
  placeholder = "Click to add text",
  multiline = false,
}: {
  path: (string | number)[];
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div" | "li" | "dt" | "dd";
  placeholder?: string;
  multiline?: boolean;
}) {
  const { editing, content, update } = useSection();
  const raw = getAtPath(content, path);
  const text = typeof raw === "string" ? raw : "";
  const Tag = as as "span";
  const rich = isRichHtml(text);

  if (!editing) {
    if (rich) {
      return (
        <Tag
          className={cn(multiline && "whitespace-pre-line", className)}
          dangerouslySetInnerHTML={{ __html: renderSafeHtml(text) }}
        />
      );
    }
    if (multiline) {
      return (
        <Tag className={className}>
          {text.split("\n\n").map((para, i) => (
            <span key={i} className="mb-4 block whitespace-pre-line last:mb-0">
              {para}
            </span>
          ))}
        </Tag>
      );
    }
    return <Tag className={className}>{text}</Tag>;
  }

  const commonProps = {
    contentEditable: true,
    suppressContentEditableWarning: true,
    "data-placeholder": placeholder,
    "data-site-editable": "true",
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const html = sanitizeRichHtml(el.innerHTML);
      const next = isRichHtml(html)
        ? html
        : el.innerText.replace(/\u00a0/g, " ");
      if (next !== text) update(path, next);
    },
    className: cn(
      "cursor-text rounded outline-none ring-offset-2 focus:ring-2 focus:ring-primary",
      "hover:bg-primary/10",
      multiline && "whitespace-pre-line",
      !text && "min-h-[1em] min-w-24 bg-primary/10 italic opacity-70",
      className,
    ),
  };

  if (rich) {
    return <Tag {...commonProps} dangerouslySetInnerHTML={{ __html: renderSafeHtml(text) }} />;
  }
  return <Tag {...commonProps}>{text || placeholder}</Tag>;
}

/* ------------------------------------------------------------------ */
/* Floating text formatting toolbar                                    */
/* ------------------------------------------------------------------ */

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function runCommand(cmd: string, value?: string) {
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand(cmd, false, value);
}

export function TextFormatToolbar() {
  const { editing } = useSiteEditor();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!editing) {
      setActive(false);
      return;
    }
    const onSelect = () => {
      const sel = document.getSelection();
      const node = sel?.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      setActive(Boolean(el?.closest("[data-site-editable]")));
    };
    document.addEventListener("selectionchange", onSelect);
    document.addEventListener("focusin", onSelect);
    return () => {
      document.removeEventListener("selectionchange", onSelect);
      document.removeEventListener("focusin", onSelect);
    };
  }, [editing]);

  if (!editing || !active) return null;

  const swatches = [
    { label: "Accent", value: cssVar("--primary", "#d92211") },
    { label: "Dark", value: cssVar("--ink", "#1a1a1c") },
    { label: "Light", value: cssVar("--ink-foreground", "#fafafa") },
    { label: "Muted", value: cssVar("--muted-foreground", "#71717a") },
  ];

  const hold = (e: { preventDefault: () => void }) => e.preventDefault();

  return (
    <div
      className="fixed bottom-20 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-2 py-1.5 shadow-lg"
      onMouseDown={hold}
      onTouchStart={hold}
    >
      <Button type="button" size="sm" variant="ghost" className="font-bold" onClick={() => runCommand("bold")}>
        B
      </Button>
      <Button type="button" size="sm" variant="ghost" className="italic" onClick={() => runCommand("italic")}>
        I
      </Button>
      <Button type="button" size="sm" variant="ghost" className="underline" onClick={() => runCommand("underline")}>
        U
      </Button>
      <span className="mx-1 h-5 w-px bg-border" />
      {swatches.map((s) => (
        <button
          key={s.label}
          type="button"
          aria-label={`${s.label} text colour`}
          title={s.label}
          onClick={() => runCommand("foreColor", s.value)}
          className="size-6 rounded-full border border-border"
          style={{ background: s.value }}
        />
      ))}
      <label
        className="grid size-6 cursor-pointer place-items-center rounded-full border border-border text-[10px]"
        title="Custom colour"
      >
        +
        <input
          type="color"
          className="sr-only"
          onChange={(e) => runCommand("foreColor", e.target.value)}
        />
      </label>
      <span className="mx-1 h-5 w-px bg-border" />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => runCommand("removeFormat")}
        title="Clear formatting"
      >
        Clear
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Media picker                                                        */
/* ------------------------------------------------------------------ */

async function uploadToSiteMedia(file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const key = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("site-media").upload(key, file, {
    ...(file.type ? { contentType: file.type } : {}),
    upsert: false,
  });
  if (error) throw error;
  return `/api/public/media/${key}`;
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onPicked,
  kind,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPicked: (url: string) => void;
  kind: "image" | "video";
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === "image" ? "Choose an image" : "Choose a video"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Label className="text-xs uppercase tracking-widest">Upload a file</Label>
            <Input
              type="file"
              className="mt-2"
              accept={kind === "image" ? "image/*" : "video/*"}
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  const uploaded = await uploadToSiteMedia(file);
                  onPicked(uploaded);
                  onOpenChange(false);
                  toast.success("Uploaded");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest">
              {kind === "image" ? "Or paste an image address" : "Or paste a YouTube / video link"}
            </Label>
            <div className="mt-2 flex gap-2">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
              <Button
                disabled={!url.trim()}
                onClick={() => {
                  onPicked(url.trim());
                  setUrl("");
                  onOpenChange(false);
                }}
              >
                Use
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Editable image / video                                              */
/* ------------------------------------------------------------------ */

export function EditableImage({
  path,
  className,
  imgClassName,
  altPath,
  placeholderLabel = "Add an image",
  editClassName,
}: {
  path: (string | number)[];
  className?: string;
  imgClassName?: string;
  altPath?: (string | number)[];
  placeholderLabel?: string;
  /** Extra classes for the Replace/Remove button row (e.g. move it down when a toolbar overlaps). */
  editClassName?: string;
}) {
  const { editing, content, update } = useSection();
  const [open, setOpen] = useState(false);
  const url = (getAtPath(content, path) as string) || "";
  const alt = altPath ? ((getAtPath(content, altPath) as string) || "") : "";

  if (!url && !editing) return null;

  return (
    <div className={cn("relative", className)}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" className={cn("size-full object-cover", imgClassName)} />
      ) : (
        <div className="flex min-h-40 items-center justify-center border border-dashed border-border bg-secondary text-sm text-muted-foreground">
          <ImageIcon className="mr-2 size-4" /> {placeholderLabel}
        </div>
      )}
      {editing && (
        <div className={cn("absolute right-2 top-2 z-20 flex gap-1", editClassName)}>
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Upload className="size-3.5" /> {url ? "Replace" : "Add"}
          </Button>
          {url && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => update(path, "")}
              aria-label="Remove image"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        kind="image"
        onPicked={(u) => update(path, u)}
      />
    </div>
  );
}

export function EditableVideo({ path }: { path: (string | number)[] }) {
  const { editing, content, update } = useSection();
  const [open, setOpen] = useState(false);
  const url = (getAtPath(content, path) as string) || "";
  const embed = videoEmbedUrl(url);
  /* Playback settings live next to the url: video.url / video.muted / video.loop */
  const basePath = path.slice(0, -1);
  const muted = Boolean(getAtPath(content, [...basePath, "muted"]));
  const loop = Boolean(getAtPath(content, [...basePath, "loop"]));

  return (
    <div className="relative">
      {embed ? (
        embed.kind === "iframe" ? (
          <iframe
            src={embed.src}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full border border-border"
          />
        ) : (
          <video
            src={embed.src}
            controls
            muted={muted}
            loop={loop}
            playsInline
            autoPlay={muted && loop}
            className="block h-auto w-full border border-border bg-ink"
          />
        )
      ) : (
        <div className="flex aspect-video w-full items-center justify-center border border-dashed border-border bg-secondary text-sm text-muted-foreground">
          {editing ? "Add a video" : ""}
        </div>
      )}
      {editing && (
        <div className="absolute right-2 top-2 z-20 flex gap-1">
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Link2 className="size-3.5" /> {url ? "Replace" : "Add"}
          </Button>
          {url && (
            <>
              <Button
                type="button"
                size="sm"
                variant={muted ? "default" : "secondary"}
                onClick={() => update([...basePath, "muted"], !muted)}
              >
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                {muted ? "Muted" : "Sound"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={loop ? "default" : "secondary"}
                onClick={() => update([...basePath, "loop"], !loop)}
              >
                <Repeat className="size-3.5" /> {loop ? "Looping" : "Loop"}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => update(path, "")}>
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      )}
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        kind="video"
        onPicked={(u) => update(path, u)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Array item helpers                                                  */
/* ------------------------------------------------------------------ */

export function useList<T>(path: (string | number)[], fallback: T[]) {
  const { content, update, editing } = useSection();
  const raw = getAtPath(content, path);
  const items = (Array.isArray(raw) ? raw : fallback) as T[];

  const add = useCallback(
    (item: T) => update(path, [...items, item]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, update],
  );
  const remove = useCallback(
    (index: number) => update(path, items.filter((_, i) => i !== index)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, update],
  );

  return { items, add, remove, editing };
}

export function RemoveItemButton({ onClick, label = "Remove" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute -right-2 -top-2 z-10 grid size-6 place-items-center rounded-full bg-destructive text-destructive-foreground shadow"
    >
      <X className="size-3.5" />
    </button>
  );
}

export function AddItemButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onClick}>
      <Plus className="size-4" /> {label}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Editable link (button) fields                                       */
/* ------------------------------------------------------------------ */

export function LinkTargetEditor({ path }: { path: (string | number)[] }) {
  const { content, update } = useSection();
  const to = (getAtPath(content, path) as string) || "";
  return (
    <Input
      value={to}
      onChange={(e) => update(path, e.target.value)}
      placeholder="/quote-request"
      className="mt-1 h-7 w-40 text-xs"
    />
  );
}
