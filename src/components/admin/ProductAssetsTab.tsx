import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { AlertTriangle, Check, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { signedAssetUrls, GARMENT_BUCKET } from "@/lib/storage";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type View = Database["public"]["Enums"]["garment_view"];

export const VIEWS: { key: View; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "back", label: "Back" },
  { key: "left_sleeve", label: "Left Sleeve" },
  { key: "right_sleeve", label: "Right Sleeve" },
];

export function useGarmentAssets(productId: string) {
  return useQuery({
    queryKey: ["garment-assets", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garment_assets")
        .select("*")
        .eq("product_id", productId);
      if (error) throw error;
      const urls = await signedAssetUrls(data.map((a) => a.storage_path));
      return data.map((a) => ({ ...a, url: urls[a.storage_path] ?? null }));
    },
  });
}

export function ProductAssetsTab({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

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

  async function upload(colorId: string, view: View, file: File) {
    const key = `${colorId}:${view}`;
    setBusy(key);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${productId}/${colorId}/${view}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(GARMENT_BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const dims = await readImageSize(file);
      const existing = assets.data?.find((a) => a.color_id === colorId && a.view === view);
      if (existing) {
        const { error } = await supabase
          .from("garment_assets")
          .update({ storage_path: path, image_width: dims.w, image_height: dims.h })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("garment_assets").insert({
          product_id: productId,
          color_id: colorId,
          view,
          storage_path: path,
          image_width: dims.w,
          image_height: dims.h,
        });
        if (error) throw error;
      }
      toast.success("Image uploaded");
      qc.invalidateQueries({ queryKey: ["garment-assets", productId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  const missing = (colors.data ?? []).flatMap((c) =>
    VIEWS.filter((v) => !assets.data?.some((a) => a.color_id === c.id && a.view === v.key)).map(
      (v) => `${c.name} · ${v.label}`,
    ),
  );

  return (
    <div className="grid gap-8">
      {colors.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">Add colours first, then upload their images.</p>
      )}

      {missing.length > 0 && colors.data && colors.data.length > 0 && (
        <div className="flex gap-3 border-l-4 border-primary bg-secondary p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">{missing.length} garment images are missing</p>
            <p className="mt-1 text-muted-foreground">{missing.join(", ")}</p>
            <p className="mt-1 text-muted-foreground">
              Missing views are never substituted with another colour — they simply can't be
              ordered until you upload them.
            </p>
          </div>
        </div>
      )}

      {colors.data?.map((color) => (
        <section key={color.id}>
          <h2 className="display-heading flex items-center gap-3 text-2xl">
            <span
              className="size-5 rounded-full border border-border"
              style={{ backgroundColor: color.hex ?? "transparent" }}
            />
            {color.name}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VIEWS.map((v) => {
              const asset = assets.data?.find((a) => a.color_id === color.id && a.view === v.key);
              const key = `${color.id}:${v.key}`;
              return (
                <div key={v.key} className="border border-border bg-card">
                  <div className="flex aspect-square items-center justify-center bg-secondary">
                    {asset?.url ? (
                      <img
                        src={asset.url}
                        alt={`${color.name} ${v.label}`}
                        className="size-full object-contain"
                      />
                    ) : (
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">
                        No image
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {v.label} {asset && <Check className="inline size-3 text-primary" />}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      ref={(el) => {
                        inputs.current[key] = el;
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(color.id, v.key, file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === key}
                      onClick={() => inputs.current[key]?.click()}
                    >
                      <Upload className="size-3.5" />
                      {asset ? "Replace" : "Upload"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function readImageSize(file: File): Promise<{ w: number | null; h: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ w: null, h: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
