import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Crosshair } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VIEWS, useGarmentAssets } from "./ProductAssetsTab";
import type { Database } from "@/integrations/supabase/types";

type View = Database["public"]["Enums"]["garment_view"];
type RefType = Database["public"]["Enums"]["calibration_reference_type"];
type Calibration = Database["public"]["Tables"]["calibrations"]["Row"];

const REFERENCE_TYPES: { key: RefType; label: string; hint: string }[] = [
  { key: "collar", label: "Collar seam", hint: "Centre of the collar seam at the back of the neck" },
  { key: "neckline", label: "Neckline front", hint: "Centre of the front neckline opening" },
  { key: "sleeve_top", label: "Sleeve top", hint: "Highest point of the shoulder/sleeve seam" },
  { key: "sleeve_seam", label: "Sleeve seam", hint: "Where the sleeve joins the body" },
  { key: "cuff", label: "Cuff", hint: "Edge of the sleeve cuff" },
  { key: "custom", label: "Custom point", hint: "Any reference point you name yourself" },
];

const DEFAULT_TYPE_BY_VIEW: Record<View, RefType> = {
  front: "neckline",
  back: "collar",
  left_sleeve: "sleeve_top",
  right_sleeve: "sleeve_top",
};

export function ProductCalibrationTab({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("front");
  const [previewColorId, setPreviewColorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      return data;
    },
  });

  const calibrations = useQuery({
    queryKey: ["calibrations", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calibrations")
        .select("*")
        .eq("product_id", productId);
      if (error) throw error;
      return data as Calibration[];
    },
  });

  useEffect(() => {
    if (!previewColorId && colors.data?.[0]) setPreviewColorId(colors.data[0].id);
  }, [colors.data, previewColorId]);

  const current = calibrations.data?.find((c) => c.view === view) ?? null;
  const asset = assets.data?.find((a) => a.color_id === previewColorId && a.view === view);
  const area = areas.data?.find((a) => a.view === view);

  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [refType, setRefType] = useState<RefType>(DEFAULT_TYPE_BY_VIEW[view]);
  const [refLabel, setRefLabel] = useState("");

  useEffect(() => {
    if (current) {
      setPoint({ x: Number(current.reference_x_pct), y: Number(current.reference_y_pct) });
      setRefType(current.reference_type);
      setRefLabel(current.reference_label ?? "");
    } else {
      setPoint(null);
      setRefType(DEFAULT_TYPE_BY_VIEW[view]);
      setRefLabel("");
    }
  }, [current?.id, view]);

  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function setFromEvent(e: React.PointerEvent) {
    const box = boxRef.current;
    if (!box) return;
    const b = box.getBoundingClientRect();
    setPoint({
      x: round(clamp(((e.clientX - b.left) / b.width) * 100, 0, 100)),
      y: round(clamp(((e.clientY - b.top) / b.height) * 100, 0, 100)),
    });
  }

  // Pixels per inch is derived from the print area: its width in image pixels
  // divided by the printable width in inches.
  const pixelsPerInch = useMemo(() => {
    const imgW = asset?.image_width ?? null;
    if (!imgW || !area?.physical_width_in) return null;
    const areaPx = (Number(area.width_pct) / 100) * imgW;
    const ppi = areaPx / Number(area.physical_width_in);
    return Number.isFinite(ppi) && ppi > 0 ? round(ppi) : null;
  }, [asset?.image_width, area?.width_pct, area?.physical_width_in]);

  async function save(confirm: boolean) {
    if (!point) {
      toast.error("Click the garment to place the reference marker first");
      return;
    }
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const payload = {
        product_id: productId,
        view,
        reference_type: refType,
        reference_label: refLabel.trim() || null,
        reference_x_pct: point.x,
        reference_y_pct: point.y,
        physical_width_in: area?.physical_width_in ?? null,
        physical_height_in: area?.physical_height_in ?? null,
        pixels_per_inch: pixelsPerInch,
        confirmed: confirm,
        confirmed_by: confirm ? (userRes.user?.id ?? null) : null,
        confirmed_at: confirm ? new Date().toISOString() : null,
      };
      if (current) {
        const { error } = await supabase
          .from("calibrations")
          .update({ ...payload, version: current.version + 1 })
          .eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("calibrations").insert(payload);
        if (error) throw error;
      }
      toast.success(confirm ? "Calibration confirmed" : "Calibration saved");
      qc.invalidateQueries({ queryKey: ["calibrations", productId] });
      qc.invalidateQueries({ queryKey: ["product-readiness", productId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save calibration");
    } finally {
      setSaving(false);
    }
  }

  async function clearMarker() {
    if (!current) {
      setPoint(null);
      return;
    }
    const { error } = await supabase.from("calibrations").delete().eq("id", current.id);
    if (error) { toast.error(error.message); return; }
    setPoint(null);
    toast.success("Calibration removed");
    qc.invalidateQueries({ queryKey: ["calibrations", productId] });
    qc.invalidateQueries({ queryKey: ["product-readiness", productId] });
  }

  const hint = REFERENCE_TYPES.find((r) => r.key === refType)?.hint ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex flex-wrap gap-2">
          {VIEWS.map((v) => {
            const cal = calibrations.data?.find((c) => c.view === v.key);
            return (
              <Button
                key={v.key}
                size="sm"
                variant={view === v.key ? "default" : "outline"}
                onClick={() => setView(v.key)}
              >
                {v.label}
                {cal?.confirmed && <Check className="ml-1 size-3" />}
              </Button>
            );
          })}
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

        <p className="mt-3 text-sm text-muted-foreground">
          Click on the garment to drop the {REFERENCE_TYPES.find((r) => r.key === refType)?.label}{" "}
          marker. Drag it to fine-tune.
        </p>

        <div
          ref={boxRef}
          className="relative mt-3 aspect-square w-full max-w-xl cursor-crosshair select-none border border-border bg-secondary"
          onPointerDown={(e) => {
            dragging.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setFromEvent(e);
          }}
          onPointerMove={(e) => {
            if (dragging.current) setFromEvent(e);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
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

          {area && (
            <div
              className="pointer-events-none absolute border border-dashed border-muted-foreground/60"
              style={{
                left: `${Number(area.x_pct)}%`,
                top: `${Number(area.y_pct)}%`,
                width: `${Number(area.width_pct)}%`,
                height: `${Number(area.height_pct)}%`,
              }}
            />
          )}

          {point && (
            <div
              className="pointer-events-none absolute"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <div className="-translate-x-1/2 -translate-y-1/2">
                <Crosshair className="size-8 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <div>
          <h3 className="display-heading text-xl">Reference marker</h3>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>

        <div className="grid gap-2">
          <Label>Reference point</Label>
          <Select value={refType} onValueChange={(v) => setRefType(v as RefType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFERENCE_TYPES.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reflabel">Label (optional)</Label>
          <Input
            id="reflabel"
            value={refLabel}
            placeholder="e.g. Collar seam centre"
            onChange={(e) => setRefLabel(e.target.value)}
          />
        </div>

        <div className="border border-border p-3 text-sm">
          <p className="font-semibold">Scale</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pixelsPerInch
              ? `${pixelsPerInch} pixels per inch, from the ${area?.physical_width_in}" print area on this view.`
              : "Set this view's print area width in inches (and upload its image) to calculate scale."}
          </p>
          {point && (
            <p className="mt-2 text-xs text-muted-foreground">
              Marker at {point.x}% across, {point.y}% down.
            </p>
          )}
          {current?.confirmed && (
            <p className="mt-2 text-xs font-semibold text-primary">Confirmed for production</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save(true)} disabled={saving}>
            Confirm calibration
          </Button>
          <Button variant="outline" onClick={() => void save(false)} disabled={saving}>
            Save draft
          </Button>
          <Button variant="outline" onClick={() => void clearMarker()}>
            Clear
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
