import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ProductColorsTab({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [sizeLabel, setSizeLabel] = useState("");

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

  const sizes = useQuery({
    queryKey: ["product-sizes", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_sizes")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const variants = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, color_id, size_id, sku, quantity_available")
        .eq("product_id", productId);
      if (error) throw error;
      return data;
    },
  });

  async function addColor() {
    if (!name.trim()) { toast.error("Name the colour"); return; }
    const { error } = await supabase.from("product_colors").insert({
      product_id: productId,
      name: name.trim(),
      hex,
      sort_order: colors.data?.length ?? 0,
    });
    if (error) { toast.error(error.message); return; }
    setName("");
    qc.invalidateQueries({ queryKey: ["product-colors", productId] });
  }

  async function addSize() {
    if (!sizeLabel.trim()) { toast.error("Name the size"); return; }
    const { error } = await supabase.from("product_sizes").insert({
      product_id: productId,
      label: sizeLabel.trim().toUpperCase(),
      sort_order: sizes.data?.length ?? 0,
    });
    if (error) { toast.error(error.message); return; }
    setSizeLabel("");
    qc.invalidateQueries({ queryKey: ["product-sizes", productId] });
  }

  async function generateVariants() {
    const existing = new Set((variants.data ?? []).map((v) => `${v.color_id}:${v.size_id}`));
    const rows = [];
    for (const c of colors.data ?? []) {
      for (const s of sizes.data ?? []) {
        if (!existing.has(`${c.id}:${s.id}`)) {
          rows.push({ product_id: productId, color_id: c.id, size_id: s.id });
        }
      }
    }
    if (rows.length === 0) { toast.info("Every colour/size combination already exists"); return; }
    const { error } = await supabase.from("product_variants").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} variants created`);
    qc.invalidateQueries({ queryKey: ["product-variants", productId] });
  }

  async function removeColor(id: string) {
    const { error } = await supabase.from("product_colors").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["product-colors", productId] });
    qc.invalidateQueries({ queryKey: ["product-variants", productId] });
  }

  async function removeSize(id: string) {
    const { error } = await supabase.from("product_sizes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["product-sizes", productId] });
    qc.invalidateQueries({ queryKey: ["product-variants", productId] });
  }

  return (
    <div className="grid gap-10">
      <section>
        <h2 className="display-heading text-2xl">Colours</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Colour name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Black"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-hex">Swatch</Label>
            <Input
              id="c-hex"
              type="color"
              className="h-10 w-20 p-1"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
            />
          </div>
          <Button onClick={addColor}>
            <Plus className="size-4" /> Add colour
          </Button>
        </div>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {colors.data?.map((c) => (
            <li key={c.id} className="flex items-center gap-3 border border-border bg-card p-3">
              <span
                className="size-6 rounded-full border border-border"
                style={{ backgroundColor: c.hex ?? "transparent" }}
              />
              <span className="flex-1 text-sm font-semibold">{c.name}</span>
              <Button size="sm" variant="ghost" onClick={() => removeColor(c.id)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="display-heading text-2xl">Sizes</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="grid gap-2">
            <Label htmlFor="s-label">Size label</Label>
            <Input
              id="s-label"
              value={sizeLabel}
              onChange={(e) => setSizeLabel(e.target.value)}
              placeholder="M"
            />
          </div>
          <Button onClick={addSize}>
            <Plus className="size-4" /> Add size
          </Button>
        </div>
        <ul className="mt-5 flex flex-wrap gap-2">
          {sizes.data?.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="font-semibold">{s.label}</span>
              <button onClick={() => removeSize(s.id)} aria-label={`Remove ${s.label}`}>
                <Trash2 className="size-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="display-heading text-2xl">Variants</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Variants are the sellable colour + size combinations that carry SKU and stock.
        </p>
        <Button className="mt-4" onClick={generateVariants}>
          Generate missing variants
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">
          {variants.data?.length ?? 0} variants exist for {colors.data?.length ?? 0} colours ×{" "}
          {sizes.data?.length ?? 0} sizes.
        </p>
      </section>
    </div>
  );
}
