import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  EditableImage,
  EditableText,
  EditableVideo,
  RemoveItemButton,
  useList,
  useSection,
} from "@/components/site/editor/SiteEditor";
import {
  ANIMATIONS,
  ButtonStyleEditor,
  Choices,
  buttonClasses,
  buttonSize,
  buttonVariant,
  type LinkItem,
} from "@/components/site/editor/ButtonStyle";

type BlockKind = "text" | "image" | "video" | "buttons";

export type SubBlock = {
  kind: BlockKind;
  animation?: string;
  width?: string;
  text?: string;
  image?: { url: string; alt: string };
  video?: string;
  caption?: string;
  buttons?: LinkItem[];
};

const BLOCK_LABELS: { kind: BlockKind; label: string; blank: SubBlock }[] = [
  { kind: "text", label: "Text", blank: { kind: "text", text: "Write something here." } },
  { kind: "image", label: "Image", blank: { kind: "image", image: { url: "", alt: "" } } },
  { kind: "video", label: "Video", blank: { kind: "video", video: "" } },
  {
    kind: "buttons",
    label: "Buttons",
    blank: { kind: "buttons", buttons: [{ label: "Get a quote", to: "/quote-request" }] },
  },
];

const WIDTHS = [
  { value: "full", label: "Full width" },
  { value: "wide", label: "Wide" },
  { value: "narrow", label: "Narrow" },
];

const widthClass: Record<string, string> = {
  full: "w-full",
  wide: "mx-auto w-full max-w-4xl",
  narrow: "mx-auto w-full max-w-2xl",
};

/**
 * Extra content blocks an administrator can add inside any section:
 * text, images, videos, and button rows, each with an optional animation.
 */
export function Subsections({ path = ["blocks"] }: { path?: (string | number)[] }) {
  const { items, add, remove, editing } = useList<SubBlock>(path, []);
  const { update } = useSection();

  if (!editing && items.length === 0) return null;

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    update(path, next);
  };

  return (
    <div className={cn("section-shell", items.length > 0 && "mt-10", "space-y-10")}>
      {items.map((block, i) => (
        <div
          key={i}
          className={cn(
            "relative",
            widthClass[block.width ?? "full"],
            block.animation,
            editing && "outline-dashed outline-1 outline-border",
          )}
        >
          {editing && (
            <div className="absolute -top-3 left-2 z-30 flex items-center gap-1 rounded bg-ink/90 px-1 py-0.5 text-ink-foreground">
              <span className="px-1 text-[10px] uppercase tracking-widest opacity-70">
                {block.kind}
              </span>
              <MiniBtn label="Move up" onClick={() => move(i, -1)}>
                <ArrowUp className="size-3.5" />
              </MiniBtn>
              <MiniBtn label="Move down" onClick={() => move(i, 1)}>
                <ArrowDown className="size-3.5" />
              </MiniBtn>
              <BlockSettings path={[...path, i]} block={block} />
            </div>
          )}
          {editing && <RemoveItemButton onClick={() => remove(i)} label="Remove block" />}
          <BlockBody path={[...path, i]} block={block} />
        </div>
      ))}

      {editing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="size-4" /> Add a block inside this section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {BLOCK_LABELS.map((b) => (
              <DropdownMenuItem key={b.kind} onSelect={() => add({ ...b.blank })}>
                {b.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function BlockBody({ path, block }: { path: (string | number)[]; block: SubBlock }) {
  switch (block.kind) {
    case "text":
      return (
        <EditableText
          as="div"
          multiline
          path={[...path, "text"]}
          placeholder="Write something here."
          className="block text-base leading-relaxed"
        />
      );
    case "image":
      return (
        <figure>
          <EditableImage
            path={[...path, "image", "url"]}
            altPath={[...path, "image", "alt"]}
            className="overflow-hidden border border-border"
            editClassName="top-14 sm:top-2"
          />
          <EditableText
            as="p"
            path={[...path, "caption"]}
            placeholder="Optional caption"
            className="mt-2 block text-sm text-muted-foreground"
          />
        </figure>
      );
    case "video":
      return (
        <figure>
          <EditableVideo path={[...path, "video"]} />
          <EditableText
            as="p"
            path={[...path, "caption"]}
            placeholder="Optional caption"
            className="mt-2 block text-sm text-muted-foreground"
          />
        </figure>
      );
    case "buttons":
      return <BlockButtons path={[...path, "buttons"]} />;
    default:
      return null;
  }
}

function BlockButtons({ path }: { path: (string | number)[] }) {
  const { items, add, remove, editing } = useList<LinkItem>(path, []);
  if (!editing && items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-start gap-3">
      {items.map((item, i) => (
        <div key={i} className="relative">
          {editing && <RemoveItemButton onClick={() => remove(i)} />}
          <Button
            asChild
            size={buttonSize(item)}
            variant={buttonVariant(item, i === 0 ? "default" : "outline")}
            className={buttonClasses(item)}
          >
            <a href={editing ? undefined : item.to || "#"}>
              <EditableText path={[...path, i, "label"]} placeholder="Button label" />
            </a>
          </Button>
          {editing && <ButtonStyleEditor path={[...path, i]} />}
        </div>
      ))}
      {editing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add({ label: "New button", to: "/contact" })}
        >
          <Plus className="size-4" /> Add button
        </Button>
      )}
    </div>
  );
}

function BlockSettings({ path, block }: { path: (string | number)[]; block: SubBlock }) {
  const { update } = useSection();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="rounded px-1 text-[10px] uppercase hover:bg-steel">
          Style
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[80] w-60 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Width</p>
          <Choices
            options={WIDTHS}
            value={block.width ?? "full"}
            onSelect={(v) => update([...path, "width"], v)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Animation</p>
          <Choices
            options={ANIMATIONS}
            value={block.animation ?? ""}
            onSelect={(v) => update([...path, "animation"], v)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MiniBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-6 place-items-center rounded hover:bg-steel"
    >
      {children}
    </button>
  );
}
