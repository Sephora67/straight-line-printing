import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Copy, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  component: ProductsList,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


function ProductsList() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [garmentType, setGarmentType] = useState("");
  const [basePrice, setBasePrice] = useState("0");

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, brand, garment_type, status, base_price, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function createProduct() {
    if (!name.trim()) { toast.error("Give the product a name"); return; }
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        slug: slugify(name),
        brand: brand || null,
        garment_type: garmentType || null,
        base_price: Number(basePrice) || 0,
      })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success("Product created");
    setOpen(false);
    setName("");
    setBrand("");
    setGarmentType("");
    setBasePrice("0");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    if (data) window.location.href = `/admin/products/${data.id}`;
  }

  async function duplicate(id: string) {
    const { data: src } = await supabase.from("products").select("*").eq("id", id).single();
    if (!src) return;
    const { id: _id, created_at, updated_at, ...rest } = src;
    const { data, error } = await supabase
      .from("products")
      .insert({ ...rest, name: `${src.name} (copy)`, slug: `${src.slug}-copy-${Date.now()}`, status: "draft" })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success("Product duplicated", { description: "Colours and assets are not copied." });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    void data;
  }

  async function archive(id: string) {
    const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product archived");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display-heading text-4xl">Products</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> New product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-name">Name</Label>
                <Input
                  id="p-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Heavyweight Cotton Tee"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-brand">Brand</Label>
                <Input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-type">Garment type</Label>
                <Input
                  id="p-type"
                  value={garmentType}
                  onChange={(e) => setGarmentType(e.target.value)}
                  placeholder="T-shirt"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-price">Base price (CAD)</Label>
                <Input
                  id="p-price"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createProduct}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-widest">
            <tr>
              {["Name", "Brand", "Type", "Base price", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.data?.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">
                  <Link
                    to="/admin/products/$productId"
                    params={{ productId: p.id }}
                    className="hover:text-primary"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.brand ?? "—"}</td>
                <td className="px-4 py-3">{p.garment_type ?? "—"}</td>
                <td className="px-4 py-3">${Number(p.base_price).toFixed(2)}</td>
                <td className="px-4 py-3 uppercase text-xs tracking-wide">{p.status}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => duplicate(p.id)}>
                      <Copy className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => archive(p.id)}>
                      <Archive className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {products.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No products yet. Create your first garment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
