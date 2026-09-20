import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getAtPath } from "@/lib/site-content";
import { useSection } from "@/components/site/editor/SiteEditor";

export type ButtonStyle = {
  variant?: string;
  size?: string;
  shape?: string;
  full?: boolean;
  animation?: string;
};

export type LinkItem = { label: string; to: string } & ButtonStyle;

export const BUTTON_VARIANTS = [
  { value: "default", label: "Solid accent" },
  { value: "secondary", label: "Soft" },
  { value: "outline", label: "Outlined" },
  { value: "ghost", label: "Plain" },
  { value: "destructive", label: "Alert" },
  { value: "link", label: "Text link" },
];

export const BUTTON_SIZES = [
  { value: "sm", label: "Small" },
  { value: "default", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
];

export const BUTTON_SHAPES = [
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
  { value: "square", label: "Square" },
];

export const ANIMATIONS = [
  { value: "", label: "None" },
  { value: "animate-fade-in", label: "Fade in" },
  { value: "animate-scale-in", label: "Pop in" },
  { value: "animate-slide-in-right", label: "Slide in" },
  { value: "hover-scale", label: "Grow on hover" },
  { value: "pulse", label: "Pulse" },
];

const shapeClass: Record<string, string> = {
  rounded: "rounded-md",
  pill: "rounded-full",
  square: "rounded-none",
};

export function buttonClasses(style: ButtonStyle | undefined) {
  return cn(
    shapeClass[style?.shape ?? "rounded"] ?? shapeClass["rounded"],
    style?.size === "xl" && "h-14 px-10 text-base",
    style?.full && "w-full",
    style?.animation,
  );
}

export function buttonSize(style: ButtonStyle | undefined) {
  const s = style?.size ?? "lg";
  return (s === "xl" ? "lg" : s) as "sm" | "default" | "lg";
}

export function buttonVariant(style: ButtonStyle | undefined, fallback: string) {
  return (style?.variant ?? fallback) as
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "link";
}

/** Small popover letting staff change a button's look, not just its words. */
export function ButtonStyleEditor({ path }: { path: (string | number)[] }) {
  const { content, update } = useSection();
  const style = (getAtPath(content, path) as ButtonStyle | undefined) ?? {};
  const to = (getAtPath(content, [...path, "to"]) as string) || "";

  const set = (key: keyof ButtonStyle, value: unknown) =>
    update([...path, key], value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="mt-1 h-7 text-xs">
          <Settings2 className="size-3.5" /> Style
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[80] w-64 space-y-3">
        <Field label="Links to">
          <Input
            value={to}
            onChange={(e) => update([...path, "to"], e.target.value)}
            placeholder="/quote-request"
            className="h-8 text-xs"
          />
        </Field>
        <Field label="Look">
          <Choices
            options={BUTTON_VARIANTS}
            value={style.variant ?? ""}
            onSelect={(v) => set("variant", v)}
          />
        </Field>
        <Field label="Size">
          <Choices
            options={BUTTON_SIZES}
            value={style.size ?? "lg"}
            onSelect={(v) => set("size", v)}
          />
        </Field>
        <Field label="Shape">
          <Choices
            options={BUTTON_SHAPES}
            value={style.shape ?? "rounded"}
            onSelect={(v) => set("shape", v)}
          />
        </Field>
        <Field label="Animation">
          <Choices
            options={ANIMATIONS}
            value={style.animation ?? ""}
            onSelect={(v) => set("animation", v)}
          />
        </Field>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={Boolean(style.full)}
            onChange={(e) => set("full", e.target.checked)}
          />
          Full width
        </label>
      </PopoverContent>
    </Popover>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function Choices({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value || "none"}
          type="button"
          onClick={() => onSelect(o.value)}
          className={cn(
            "rounded border border-border px-2 py-1 text-[11px]",
            value === o.value ? "bg-primary text-primary-foreground" : "bg-card",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
