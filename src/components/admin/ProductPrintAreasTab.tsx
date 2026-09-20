import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { VIEWS, useGarmentAssets } from "./ProductAssetsTab";
import type { Database } from "@/integrations/supabase/types";

type View = Database["public"]["Enums"]["garment_view"];
type PrintArea = Database["public"]["Tables"]["print_areas"]["Row"];

const DEFAULT_RECT = { x_pct: 25, y_pct: 20, width_pct: 50, height_pct: 45 };

export function ProductPrintAreasTab({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("front");
  const [previewColorId, setPreviewColorId] = useState<string | null>(null);

  const colors = useQuery({
    queryKey: ["product-colors", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_colors")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const assets = useGarmentAssets(productId);

  const areas = useQuery({
    queryKey: ["print-areas", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("print_areas")
        .select("*")
        .eq("product_id", productId);
      if (error) throw error;
      return data as PrintArea[];
    },
  });

  useEffect(() => {
    if (!previewColorId && colors.data?.[0]) setPreviewColorId(colors.data[0].id);
  }, [colors.data, previewColorId]);

  const area = areas.data?.find((a) => a.view === view) ?? null;
  const asset = assets.data?.find((a) => a.color_id === previewColorId && a.view === view);

  const [rect, setRect] = useState(DEFAULT_RECT);
  const [physW, setPhysW] = useState("");
  const [physH, setPhysH] = useState("");

  useEffect(() => {
    if (area) {
      setRect({
        x_pct: Number(area.x_pct),
        y_pct: Number(area.y_pct),
        width_pct: Number(area.width_pct),
        height_pct: Number(area.height_pct),
      });
      setPhysW(area.physical_width_in ? String(area.physical_width_in) : "");
      setPhysH(area.physical_height_in ? String(area.physical_height_in) : "");
    } else {
      setRect(DEFAULT_RECT);
      setPhysW("");
      setPhysH("");
    }
  }, [area?.id, view]);

  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | "resize"; x: number; y: number; start: typeof DEFAULT_RECT } | null>(
    null,
  );

  function onPointerDown(mode: "move" | "resize", e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, start: rect };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const box = boxRef.current;
    if (!d || !box) return;
    const b = box.getBoundingClientRect();
    const dx = ((e.clientX - d.x) / b.width) * 100;
    const dy = ((e.clientY - d.y) / b.height) * 100;
    if (d.mode === "move") {
      setRect({
        ...d.start,
        x_pct: clamp(d.start.x_pct + dx, 0, 100 - d.start.width_pct),
        y_pct: clamp(d.start.y_pct + dy, 0, 100 - d.start.height_pct),
      });
    } else {
      setRect({
        ...d.start,
        width_pct: clamp(d.start.width_pct + dx, 5, 100 - d.start.x_pct),
        height_pct: clamp(d.start.height_pct + dy, 5, 100 - d.start.y_pct),
      });
    }
  }

  function onPointerUp() {
    drag.current = null;
  }

  async function save() {
    const payload = {
      product_id: productId,
      view,
      name: VIEWS.find((v) => v.key === view)?.label ?? view,
      x_pct: round(rect.x_pct),
      y_pct: round(rect.y_pct),
      width_pct: round(rect.width_pct),
      height_pct: round(rect.height_pct),
      physical_width_in: physW ? Number(physW) : null,
      physical_height_in: physH ? Number(physH) : null,
    };
    if (area) {
      await supabase.from("print_area_revisions").insert({
        print_area_id: area.id,
        snapshot: JSON.parse(JSON.stringify(area)),
      });
      const { error } = await supabase
        .from("print_areas")
        .update({ ...payload, version: area.version + 1 })
        .eq("id", area.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("print_areas").insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Print area saved");
    qc.invalidateQueries({ queryKey: ["print-areas", productId] });
  }

  async function restorePrevious() {
    if (!area) return;
    const { data } = await supabase
      .from("print_area_revisions")
      .select("snapshot")
      .eq("print_area_id", area.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const snap = data?.[0]?.snapshot as Record<string, unknown> | undefined;
    if (!snap) { toast.info("No earlier version saved yet"); return; }
    setRect({
      x_pct: Number(snap["x_pct"]),
      y_pct: Number(snap["y_pct"]),
      width_pct: Number(snap["width_pct"]),
      height_pct: Number(snap["height_pct"]),
    });
    toast.success("Previous version loaded — save to apply");
  }

  const inchNote = useMemo(() => {
    if (!physW || !physH) return "Physical size not set yet.";
    return `Design Studio and production will treat this rectangle as ${physW}" wide × ${physH}" high.`;
  }, [physW, physH]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <Button
              key={v.key}
              size="sm"
              variant={view === v.key ? "default" : "outline"}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </Button>
          ))}
        </div>

        {colors.data && colors.data.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Preview on
            </span>
            {colors.data.map((c) => (
              <button
                key={c.id}
                onClick={() => setPreviewColorId(c.id)}
                aria-label={c.name}
                className={`size-6 rounded-full border-2 ${
                  previewColorId === c.id ? "border-primary" : "border-border"
                }`}
                style={{ backgroundColor: c.hex ?? "transparent" }}
              />
            ))}
          </div>
        )}

        <div
          ref={boxRef}
          className="relative mt-4 aspect-square w-full max-w-xl select-none border border-border bg-secondary"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {asset?.url ? (
            <img
              src={asset.url}
              alt="Garment preview"
              className="pointer-events-none size-full object-contain"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              Upload a garment image for this colour and view
            </div>
          )}

          <div
            className="absolute cursor-move border-2 border-dashed border-primary bg-primary/10"
            style={{
              left: `${rect.x_pct}%`,
              top: `${rect.y_pct}%`,
              width: `${rect.width_pct}%`,
              height: `${rect.height_pct}%`,
            }}
            onPointerDown={(e) => onPointerDown("move", e)}
          >
            <div
              className="absolute -bottom-2 -right-2 size-4 cursor-se-resize rounded-full bg-primary"
              onPointerDown={(e) => onPointerDown("resize", e)}
            />
          </div>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <div>
          <h3 className="display-heading text-xl">Physical print size</h3>
          <p className="mt-1 text-xs text-muted-foreground">{inchNote}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pw">Printable width (inches)</Label>
          <Input id="pw" type="number" step="0.25" value={physW} onChange={(e) => setPhysW(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ph">Printable height (inches)</Label>
          <Input id="ph" type="number" step="0.25" value={physH} onChange={(e) => setPhysH(e.target.value)} />
        </div>

        <details className="border border-border p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Advanced coordinates</summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["x_pct", "y_pct", "width_pct", "height_pct"] as const).map((k) => (
              <div key={k} className="grid gap-1">
                <Label htmlFor={k} className="text-xs">
                  {k.replace("_pct", "")} %
                </Label>
                <Input
                  id={k}
                  type="number"
                  step="0.1"
                  value={round(rect[k])}
                  onChange={(e) => setRect({ ...rect, [k]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </details>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save}>Save print area</Button>
          <Button variant="outline" onClick={() => setRect(DEFAULT_RECT)}>
            Reset
          </Button>
          <Button variant="outline" onClick={restorePrevious}>
            Restore previous
          </Button>
        </div>
      </aside>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
function round(v: number) {
  return Math.round(v * 100) / 100;
}
