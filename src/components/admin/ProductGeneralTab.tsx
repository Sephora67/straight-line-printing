import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

const fields: { key: keyof Product; label: string; type?: string }[] = [
  { key: "name", label: "Product name" },
  { key: "slug", label: "URL slug" },
  { key: "brand", label: "Brand" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "sku", label: "SKU" },
  { key: "garment_type", label: "Garment type" },
  { key: "fabric", label: "Fabric" },
  { key: "weight", label: "Weight" },
  { key: "fit", label: "Fit" },
  { key: "gender", label: "Gender / category" },
  { key: "base_price", label: "Base price (CAD)", type: "number" },
  { key: "wholesale_cost", label: "Wholesale cost (CAD)", type: "number" },
];

export function ProductGeneralTab({ product }: { product: Product }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, unknown>>({ ...product });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = form[f.key as string];
      payload[f.key as string] =
        f.type === "number" ? (raw === "" || raw == null ? null : Number(raw)) : raw || null;
    }
    payload["description"] = form["description"] || null;
    payload["pod_enabled"] = form["pod_enabled"];
    payload["bulk_enabled"] = form["bulk_enabled"];
    if (!payload["base_price"]) payload["base_price"] = 0;

    const { error } = await supabase
      .from("products")
      .update(payload as never)
      .eq("id", product.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["admin-product", product.id] });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key as string} className="grid gap-2">
            <Label htmlFor={f.key as string}>{f.label}</Label>
            <Input
              id={f.key as string}
              type={f.type ?? "text"}
              step={f.type === "number" ? "0.01" : undefined}
              value={(form[f.key as string] as string | number | null) ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          value={(form["description"] as string) ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-8">
        {[
          ["pod_enabled", "Print-on-demand enabled"],
          ["bulk_enabled", "Bulk ordering enabled"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <Switch
              checked={Boolean(form[key as string])}
              onCheckedChange={(v) => setForm({ ...form, [key as string]: v })}
            />
            {label}
          </label>
        ))}
      </div>

      <div>
        <Button onClick={save} disabled={saving}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
