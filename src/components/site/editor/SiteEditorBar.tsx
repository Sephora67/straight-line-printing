import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Files, Palette, Pencil, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useSession";
import { usePermissions } from "@/hooks/use-permissions";
import {
  BODY_FONTS,
  COLOR_LABELS,
  DEFAULT_COLORS,
  DISPLAY_FONTS,
  themeQueryKey,
} from "@/lib/site-content";
import { TextFormatToolbar, useSiteEditor } from "./SiteEditor";
import { useTheme } from "@/components/site/ThemeStyle";
import { PagesPanel } from "./PagesPanel";
import { WordingPanel } from "./WordingPanel";

/** Routes that are application screens, not editable marketing pages. */
const APP_ROUTE_PREFIXES = [
  "/account",
  "/admin",
  "/cart",
  "/checkout",
  "/auth",
];

export function SiteEditorBar() {
  const { canEdit, editing, setEditing } = useSiteEditor();
  const [themeOpen, setThemeOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [wordingOpen, setWordingOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAppScreen =
    APP_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/design-studio/");

  useEffect(() => {
    if (isAppScreen && editing) setEditing(false);
  }, [isAppScreen, editing, setEditing]);

  if (!canEdit || isAppScreen) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 rounded-full bg-ink px-2 py-2 text-ink-foreground shadow-lg sm:gap-2 sm:px-3">
        <Button
          size="sm"
          variant={editing ? "default" : "ghost"}
          className={editing ? "" : "text-ink-foreground hover:bg-steel"}
          onClick={() => setEditing(!editing)}
        >
          {editing ? <Check className="size-4" /> : <Pencil className="size-4" />}
          {editing ? "Done editing" : "Edit this page"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-ink-foreground hover:bg-steel"
          onClick={() => setThemeOpen(true)}
        >
          <Palette className="size-4" /> Theme
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-ink-foreground hover:bg-steel"
          onClick={() => setWordingOpen(true)}
        >
          <Type className="size-4" /> Wording
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-ink-foreground hover:bg-steel"
          onClick={() => setPagesOpen(true)}
        >
          <Files className="size-4" /> Pages
        </Button>
      </div>
      <TextFormatToolbar />
      <ThemePanel open={themeOpen} onOpenChange={setThemeOpen} />
      <WordingPanel open={wordingOpen} onOpenChange={setWordingOpen} />
      <PagesPanel open={pagesOpen} onOpenChange={setPagesOpen} />
    </>
  );
}

function ThemePanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: theme } = useTheme();
  const queryClient = useQueryClient();
  const [colors, setColors] = useState<Record<string, string>>(DEFAULT_COLORS);
  const [display, setDisplay] = useState("Bebas Neue");
  const [body, setBody] = useState("Barlow");
  const [radius, setRadius] = useState(0.25);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!theme) return;
    setColors({ ...DEFAULT_COLORS, ...(theme.colors ?? {}) });
    setDisplay(theme.font_display);
    setBody(theme.font_body);
    setRadius(parseFloat(theme.radius) || 0.25);
  }, [theme]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_theme")
      .update({
        colors: colors as never,
        font_display: display,
        font_body: body,
        radius: `${radius}rem`,
      })
      .eq("id", "default");
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: themeQueryKey });
    toast.success("Theme saved");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Site theme</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid gap-3">
            <Label className="text-xs uppercase tracking-widest">Heading font</Label>
            <Select value={display} onValueChange={setDisplay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_FONTS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="mt-2 text-xs uppercase tracking-widest">Body font</Label>
            <Select value={body} onValueChange={setBody}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BODY_FONTS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest">Corner roundness</Label>
            <Slider
              className="mt-3"
              value={[radius]}
              min={0}
              max={1.5}
              step={0.05}
              onValueChange={(v) => setRadius(v[0] ?? 0)}
            />
          </div>

          <div className="grid gap-3">
            <Label className="text-xs uppercase tracking-widest">Colours</Label>
            {COLOR_LABELS.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-3">
                <span className="text-sm">{c.label}</span>
                <input
                  type="color"
                  value={colors[c.key] ?? DEFAULT_COLORS[c.key] ?? "#000000"}
                  onChange={(e) => setColors((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  className="size-9 cursor-pointer rounded border border-border bg-transparent"
                  aria-label={c.label}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Save theme"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setColors({ ...DEFAULT_COLORS })}
              disabled={saving}
            >
              Reset colours
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function useCanEditSite() {
  const { isStaff } = useRoles();
  const permissions = usePermissions();
  return isStaff && permissions.can("site.edit");
}
