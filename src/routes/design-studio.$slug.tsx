import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ImagePlus,
  RotateCcw,
  RotateCw,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProductBySlug } from "@/lib/catalog.functions";
import { garmentImageUrl, money, VIEW_LABEL, VIEW_ORDER, type GarmentView } from "@/lib/garment";
import { addToCart } from "@/lib/cart";
import { addBulkDesign, fileToDataUrl } from "@/lib/bulk-draft";
import {
  DEFAULT_REFERENCE,
  inchesFromPct,
  offsetFromReference,
  type DesignSnapshot,
  type GarmentViewKey,
} from "@/lib/production-spec";

export const Route = createFileRoute("/design-studio/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: search["from"] === "bulk" ? ("bulk" as const) : undefined,
  }),
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Garment";
    return {
      meta: [
        { title: `Design ${name} | Straight Line Printing` },
        {
          name: "description",
          content: `Place your artwork on the ${name}: pick a colour, upload a logo or add text and see the print size in inches.`,
        },
        { property: "og:title", content: `Design ${name} | Straight Line Printing` },
        {
          property: "og:description",
          content: `Customise the ${name} online and preview every view before ordering.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: Studio,
});

type Layer = {
  id: string;
  view: GarmentView;
  kind: "image" | "text" | "shape";
  src?: string;
  fileName?: string;
  text?: string;
  color: string;
  /** position/size in % of the print area box */
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
};

function Studio() {
  const product = Route.useLoaderData();
  const { from } = Route.useSearch();
  const navigate = useNavigate();

  const colors = useMemo(
    () =>
      [...(product.product_colors ?? [])]
        .filter((c) => c.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [product],
  );
  const sizes = useMemo(
    () =>
      [...(product.product_sizes ?? [])]
        .filter((s) => s.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [product],
  );
  const areas = (product.print_areas ?? []).filter((a) => a.is_active !== false);

  const [colorId, setColorId] = useState(colors[0]?.id ?? "");
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  const [view, setView] = useState<GarmentView>("front");
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const color = colors.find((c) => c.id === colorId) ?? colors[0];
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0];
  const asset = (product.garment_assets ?? []).find(
    (a) => a.color_id === colorId && a.view === view,
  );
  const image = garmentImageUrl(asset?.storage_path);
  const area = areas.find((a) => a.view === view);

  const viewLayers = layers.filter((l) => l.view === view);
  const selected = layers.find((l) => l.id === selectedId && l.view === view) ?? null;

  const decorationPerSide = 5;
  const decoratedViews = new Set(layers.map((l) => l.view));
  const unitPrice =
    Number(product.base_price ?? 0) +
    Number(size?.price_adjustment ?? 0) +
    decoratedViews.size * decorationPerSide;

  /** A view can only be decorated when its print area AND its colour photo exist. */
  function viewReady(v: GarmentView) {
    const hasArea = areas.some((a) => a.view === v);
    const hasAsset = (product.garment_assets ?? []).some(
      (a) => a.color_id === colorId && a.view === v,
    );
    return { hasArea, hasAsset, ok: hasArea && hasAsset };
  }

  function addLayer(partial: Partial<Layer>) {
    const ready = viewReady(view);
    if (!ready.ok) {
      toast.error(
        ready.hasArea
          ? `We don't have a ${VIEW_LABEL[view].toLowerCase()} photo in ${color?.name ?? "this colour"} yet`
          : `This view has no print area set up yet`,
      );
      return;
    }
    const layer: Layer = {
      id: crypto.randomUUID(),
      view,
      kind: "shape",
      color: "#111111",
      x: 25,
      y: 25,
      w: 50,
      h: 40,
      rotation: 0,
      ...partial,
    };
    setLayers((l) => [...l, layer]);
    setSelectedId(layer.id);
  }

  function update(id: string, patch: Partial<Layer>) {
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function rotateLayer(layer: Layer, quarterTurns: -1 | 1) {
    const nextRotation = (layer.rotation + quarterTurns * 90 + 360) % 360;
    const centerX = layer.x + layer.w / 2;
    const centerY = layer.y + layer.h / 2;
    const nextW = layer.h;
    const nextH = layer.w;
    update(layer.id, {
      rotation: nextRotation,
      w: nextW,
      h: nextH,
      x: clamp(centerX - nextW / 2, 0, Math.max(0, 100 - nextW)),
      y: clamp(centerY - nextH / 2, 0, Math.max(0, 100 - nextH)),
    });
  }

  async function onUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    // data URL, not an object URL: the artwork has to survive navigation and be
    // uploaded to private storage when the request is submitted.
    const src = await fileToDataUrl(file);
    const img = new Image();
    img.onload = () => {
      const ratio = img.height / img.width;
      const w = 55;
      addLayer({
        kind: "image",
        src,
        fileName: file.name,
        w,
        h: Math.min(90, w * ratio),
        x: 22.5,
        y: 20,
      });
    };
    img.src = src;
  }

  /** Freeze exactly what the customer configured, for production. */
  function buildSnapshot(): DesignSnapshot {
    const variant = (product.product_variants ?? []).find(
      (v) => v.color_id === colorId && v.size_id === sizeId,
    );
    const calibrations = (product.calibrations ?? []) as {
      view: GarmentView;
      reference_type: string;
      reference_label: string | null;
      reference_y_pct: number | null;
      pixels_per_inch: number | null;
      confirmed: boolean | null;
    }[];

    const placements = [...decoratedViews].map((v) => {
      const a = areas.find((x) => x.view === v) ?? null;
      const ga = (product.garment_assets ?? []).find(
        (x) => x.color_id === colorId && x.view === v,
      );
      const cal = calibrations.find((c) => c.view === v);
      const wIn = Number(a?.physical_width_in ?? 0) || null;
      const hIn = Number(a?.physical_height_in ?? 0) || null;
      return {
        view: v as GarmentViewKey,
        printAreaId: a?.id ?? null,
        printAreaName: a?.name ?? null,
        areaXPct: a ? Number(a.x_pct) : null,
        areaYPct: a ? Number(a.y_pct) : null,
        areaWidthPct: a ? Number(a.width_pct) : null,
        areaHeightPct: a ? Number(a.height_pct) : null,
        areaWidthIn: wIn,
        areaHeightIn: hIn,
        referenceType: cal?.reference_type ?? DEFAULT_REFERENCE[v as GarmentViewKey],
        referenceLabel: cal?.reference_label ?? null,
        referenceConfirmed: Boolean(cal?.confirmed),
        pixelsPerInch: cal?.pixels_per_inch ? Number(cal.pixels_per_inch) : null,
        garmentAssetId: ga?.id ?? null,
        garmentAssetPath: ga?.storage_path ?? null,
        mockupUrl: garmentImageUrl(ga?.storage_path),
        layers: layers
          .filter((l) => l.view === v)
          .map((l) => ({
            id: l.id,
            kind: l.kind,
            ...(l.text ? { text: l.text } : {}),
            color: l.color,
            ...(l.fileName ? { artworkName: l.fileName } : {}),
            ...(l.kind === "image" && l.src ? { artworkPreview: l.src } : {}),
            xPct: Number(l.x.toFixed(2)),
            yPct: Number(l.y.toFixed(2)),
            wPct: Number(l.w.toFixed(2)),
            hPct: Number(l.h.toFixed(2)),
            rotation: l.rotation,
            widthIn: inchesFromPct(l.w, wIn),
            heightIn: inchesFromPct(l.h, hIn),
            fromLeftIn: inchesFromPct(l.x, wIn),
            fromTopIn: inchesFromPct(l.y, hIn),
            offsetFromReferenceIn: offsetFromReference({
              referenceYPct: cal?.reference_y_pct ?? null,
              areaYPct: a ? Number(a.y_pct) : null,
              areaHeightPct: a ? Number(a.height_pct) : null,
              layerYPct: l.y,
              imageHeightPx: ga?.image_height ?? null,
              pixelsPerInch: cal?.pixels_per_inch ? Number(cal.pixels_per_inch) : null,
            }),
          })),
      };
    });

    return {
      version: 1,
      capturedAt: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      brand: product.brand ?? null,
      sku: product.sku ?? null,
      colorId: colorId || null,
      colorName: color?.name ?? null,
      colorHex: color?.hex ?? null,
      sizeId: sizeId || null,
      sizeLabel: size?.label ?? null,
      variantId: variant?.id ?? null,
      decorationMethod: from === "bulk" ? "bulk" : "dtf",
      quantity: 1,
      quantityMatrix: size?.label ? { [size.label]: 1 } : {},
      unitPrice,
      notes: null,
      placements,
    };
  }

  // drag / resize inside the print area box
  function startDrag(e: React.PointerEvent, layer: Layer, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    const box = stageRef.current?.querySelector<HTMLElement>("[data-print-area]");
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { ...layer };
    setSelectedId(layer.id);

    function onMove(ev: PointerEvent) {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      if (mode === "move") {
        update(origin.id, {
          x: clamp(origin.x + dx, -10, 100 - origin.w + 10),
          y: clamp(origin.y + dy, -10, 100 - origin.h + 10),
        });
      } else {
        const w = clamp(origin.w + dx, 5, 110);
        update(origin.id, { w, h: clamp(origin.h * (w / origin.w), 5, 110) });
      }
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const areaW = Number(area?.physical_width_in ?? 0);
  const areaH = Number(area?.physical_height_in ?? 0);
  const inches = (pct: number, total: number) => ((pct / 100) * total).toFixed(2);

  function addDesignToCart() {
    if (!color || !size) {
      toast.error("Pick a colour and size first");
      return;
    }
    if (layers.length === 0) {
      toast.error("Add artwork, text or a shape first");
      return;
    }
    const frontImage = garmentImageUrl(
      (product.garment_assets ?? []).find((a) => a.color_id === colorId && a.view === "front")
        ?.storage_path,
    );
    const views = [...decoratedViews].map((v) => VIEW_LABEL[v]).join(", ") + " print";

    if (from === "bulk") {
      addBulkDesign({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        colorName: color.name,
        sizeLabel: size.label,
        views,
        image: frontImage,
        snapshot: buildSnapshot(),
      });
      toast.success("Design saved to your bulk request", {
        description: "Your earlier choices are still there — finish the last step.",
      });
      void navigate({ to: "/bulk-orders" });
      return;
    }

    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colorName: color.name,
      colorHex: color.hex,
      sizeLabel: size.label,
      quantity: 1,
      unitPrice,
      image: frontImage,
      designNote: views,
      snapshot: buildSnapshot(),
    });
    toast.success("Design added to your cart");
    void navigate({ to: "/cart" });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Studio bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="section-shell flex items-center gap-3 py-3">
          <Link to="/design-studio" className="p-2 hover:text-primary" aria-label="Back to studio">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Studio</p>
            <p className="truncate font-semibold">{product.name}</p>
          </div>
          <Button onClick={addDesignToCart}>Save &amp; continue</Button>
        </div>
        <div className="section-shell flex gap-2 overflow-x-auto pb-3">
          {VIEW_ORDER.filter((v) => areas.some((a) => a.view === v)).map((v) => {
            const ready = viewReady(v);
            return (
              <button
                key={v}
                type="button"
                disabled={!ready.ok}
                title={ready.ok ? undefined : "No garment photo for this view in this colour yet"}
                onClick={() => setView(v)}
                className={`whitespace-nowrap border px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                  view === v
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                } ${ready.ok ? "" : "cursor-not-allowed opacity-40 hover:border-border"}`}
              >
                {VIEW_LABEL[v]}{" "}
                <span className={view === v ? "" : "text-primary"}>
                  {ready.ok ? `+${money(decorationPerSide)}` : "unavailable"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="section-shell grid gap-8 py-8 lg:grid-cols-[1fr_22rem]">
        {/* Canvas */}
        <div>
          <div
            ref={stageRef}
            className="relative aspect-square w-full select-none border border-border bg-secondary"
            onPointerDown={() => setSelectedId(null)}
          >
            {image ? (
              <img
                src={image}
                alt={`${product.name} ${VIEW_LABEL[view]} in ${color?.name}`}
                className="pointer-events-none absolute inset-0 size-full object-contain"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                No photo for {VIEW_LABEL[view].toLowerCase()} in {color?.name}
              </div>
            )}

            {area && (
              <div
                data-print-area
                className={`absolute ${showGuide ? "border-2 border-dashed border-primary" : ""}`}
                style={{
                  left: `${area.x_pct}%`,
                  top: `${area.y_pct}%`,
                  width: `${area.width_pct}%`,
                  height: `${area.height_pct}%`,
                }}
              >
                {viewLayers.map((l) => (
                  <div
                    key={l.id}
                    onPointerDown={(e) => startDrag(e, l, "move")}
                    className={`absolute cursor-move ${
                      selectedId === l.id ? "outline outline-1 outline-dashed outline-primary" : ""
                    }`}
                    style={{
                      left: `${l.x}%`,
                      top: `${l.y}%`,
                      width: `${l.w}%`,
                      height: `${l.h}%`,
                    }}
                  >
                    <LayerVisual layer={l} />
                    {selectedId === l.id && (
                      <span
                        onPointerDown={(e) => startDrag(e, l, "resize")}
                        className="absolute -bottom-2 -right-2 size-4 cursor-se-resize rounded-full border-2 border-primary bg-background"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {area?.name ?? "No print area"}
              {areaW ? ` · ${areaW}″ × ${areaH}″` : ""}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => setShowGuide((s) => !s)}
            >
              {showGuide ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showGuide ? "Hide guides" : "Show guides"}
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
            <ToolButton icon={<ImagePlus className="size-5" />} onClick={() => fileRef.current?.click()}>
              Image
            </ToolButton>
            <ToolButton
              icon={<Type className="size-5" />}
              onClick={() => addLayer({ kind: "text", text: "YOUR TEXT", h: 18, w: 70, x: 15, y: 30 })}
            >
              Text
            </ToolButton>
            <ToolButton
              icon={<Square className="size-5" />}
              onClick={() => addLayer({ kind: "shape" })}
            >
              Shape
            </ToolButton>
          </div>
        </div>

        {/* Panel */}
        <aside className="space-y-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">
              Colour <span className="text-muted-foreground">/ {color?.name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  onClick={() => setColorId(c.id)}
                  className={`size-8 rounded-full border-2 ${
                    c.id === colorId ? "scale-110 border-primary" : "border-border"
                  }`}
                  style={{ backgroundColor: c.hex ?? "transparent" }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSizeId(s.id)}
                  className={`min-w-12 border px-3 py-1.5 text-sm font-bold uppercase ${
                    s.id === sizeId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="border border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-widest text-primary">
                  Edit {selected.kind} layer
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLayers((ls) => ls.filter((l) => l.id !== selected.id))}
                  aria-label="Delete layer"
                >
                  <Trash2 className="size-4 text-primary" />
                </Button>
              </div>

              {selected.kind === "text" && (
                <div className="mt-3 grid gap-2">
                  <Label htmlFor="layer-text">Text</Label>
                  <Input
                    id="layer-text"
                    value={selected.text ?? ""}
                    onChange={(e) => update(selected.id, { text: e.target.value })}
                  />
                </div>
              )}

              {selected.kind !== "image" && (
                <div className="mt-3 grid gap-2">
                  <Label htmlFor="layer-color">Colour</Label>
                  <input
                    id="layer-color"
                    type="color"
                    value={selected.color}
                    onChange={(e) => update(selected.id, { color: e.target.value })}
                    className="h-10 w-full border border-border bg-background"
                  />
                </div>
              )}

              <div className="mt-4 grid gap-2">
                <Label>Orientation</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => rotateLayer(selected, -1)}
                    aria-label="Rotate artwork left 90 degrees"
                    title="Rotate left 90°"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                  <span className="min-w-16 text-center text-sm font-bold tabular-nums">
                    {selected.rotation}°
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => rotateLayer(selected, 1)}
                    aria-label="Rotate artwork right 90 degrees"
                    title="Rotate right 90°"
                  >
                    <RotateCw className="size-4" />
                  </Button>
                </div>
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest">Print measurements</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dragging the artwork updates these numbers automatically.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Measure label="Width" value={`${inches(selected.w, areaW)}″`} />
                <Measure label="Height" value={`${inches(selected.h, areaH)}″`} />
                <Measure label="From left" value={`${inches(selected.x, areaW)}″`} />
                <Measure label="From top" value={`${inches(selected.y, areaH)}″`} />
              </div>
            </div>
          ) : (
            <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
              Add an image, text or a shape, then drag it inside the highlighted print area.
            </p>
          )}

          <div className="border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Estimated per piece
              </span>
              <span className="text-2xl font-bold">{money(unitPrice)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Blank {money(product.base_price)} + {decoratedViews.size} decorated side
              {decoratedViews.size === 1 ? "" : "s"}. Final pricing confirmed on your proof.
            </p>
            <Button className="mt-4 w-full" onClick={addDesignToCart}>
              Add design to cart
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LayerVisual({ layer }: { layer: Layer }) {
  const sideways = layer.rotation % 180 !== 0;
  const visualStyle = sideways
    ? {
        left: "50%",
        top: "50%",
        width: `${(layer.h / layer.w) * 100}%`,
        height: `${(layer.w / layer.h) * 100}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
      }
    : { transform: `rotate(${layer.rotation}deg)` };
  const visualClass = sideways ? "absolute" : "size-full";

  if (layer.kind === "image" && layer.src) {
    return <img src={layer.src} alt="Artwork" className={`${visualClass} object-contain`} style={visualStyle} />;
  }
  if (layer.kind === "text") {
    return (
      <span
        className={`${visualClass} flex items-center justify-center text-center font-bold leading-none`}
        style={{ ...visualStyle, color: layer.color, fontSize: "min(6vw, 2.5rem)" }}
      >
        {layer.text}
      </span>
    );
  }
  return (
    <span
      className={`${visualClass} block`}
      style={{ ...visualStyle, backgroundColor: layer.color, borderRadius: 4 }}
    />
  );
}

function ToolButton({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 border border-border bg-card py-4 text-xs font-bold uppercase tracking-widest hover:border-primary"
    >
      {icon}
      {children}
    </button>
  );
}

function Measure({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
