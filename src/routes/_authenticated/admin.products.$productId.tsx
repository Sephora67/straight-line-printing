import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ProductGeneralTab } from "@/components/admin/ProductGeneralTab";
import { ProductColorsTab } from "@/components/admin/ProductColorsTab";
import { ProductAssetsTab, VIEWS } from "@/components/admin/ProductAssetsTab";
import { ProductPrintAreasTab } from "@/components/admin/ProductPrintAreasTab";
import { ProductCalibrationTab } from "@/components/admin/ProductCalibrationTab";

export const Route = createFileRoute("/_authenticated/admin/products/$productId")({
  component: ProductEditor,
});

function ProductEditor() {
  const { productId } = Route.useParams();
  const qc = useQueryClient();

  const product = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const readiness = useQuery({
    queryKey: ["product-readiness", productId],
    queryFn: async () => {
      const [colors, sizes, assets, areas, calibrations] = await Promise.all([
        supabase.from("product_colors").select("id, name").eq("product_id", productId),
        supabase.from("product_sizes").select("id").eq("product_id", productId),
        supabase.from("garment_assets").select("color_id, view").eq("product_id", productId),
        supabase
          .from("print_areas")
          .select("view, physical_width_in, physical_height_in")
          .eq("product_id", productId),
        supabase.from("calibrations").select("view, confirmed").eq("product_id", productId),
      ]);
      const issues: string[] = [];
      if ((colors.data?.length ?? 0) === 0) issues.push("No colours added");
      if ((sizes.data?.length ?? 0) === 0) issues.push("No sizes added");
      for (const c of colors.data ?? []) {
        for (const v of VIEWS) {
          if (!assets.data?.some((a) => a.color_id === c.id && a.view === v.key)) {
            issues.push(`Missing ${c.name} ${v.label} image`);
          }
        }
      }
      if (!areas.data?.some((a) => a.view === "front")) issues.push("No front print area");
      for (const a of areas.data ?? []) {
        if (!calibrations.data?.some((c) => c.view === a.view && c.confirmed)) {
          issues.push(`${a.view} reference marker not confirmed`);
        }
      }
      for (const a of areas.data ?? []) {
        if (!a.physical_width_in || !a.physical_height_in) {
          issues.push(`${a.view} print area has no physical size`);
        }
      }
      return issues;
    },
  });

  async function setStatus(status: "draft" | "published" | "archived") {
    const { error } = await supabase.from("products").update({ status }).eq("id", productId);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "published" ? "Product published" : `Product set to ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-product", productId] });
  }

  if (product.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!product.data) return <p className="text-muted-foreground">Product not found.</p>;

  return (
    <div>
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All products
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display-heading text-4xl">{product.data.name}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {product.data.status}
          </p>
        </div>
        <div className="flex gap-2">
          {product.data.status !== "published" ? (
            <Button
              onClick={() => setStatus("published")}
              disabled={(readiness.data?.length ?? 1) > 0}
            >
              Publish
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStatus("draft")}>
              Unpublish
            </Button>
          )}
        </div>
      </div>

      {(readiness.data?.length ?? 0) > 0 && (
        <div className="mt-5 border-l-4 border-primary bg-secondary p-4 text-sm">
          <p className="font-semibold">Finish these before publishing</p>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
            {readiness.data?.slice(0, 12).map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      )}

      <Tabs defaultValue="general" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="colors">Colours &amp; sizes</TabsTrigger>
          <TabsTrigger value="assets">Garment images</TabsTrigger>
          <TabsTrigger value="print">Print areas</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="pt-6">
          <ProductGeneralTab product={product.data} />
        </TabsContent>
        <TabsContent value="colors" className="pt-6">
          <ProductColorsTab productId={productId} />
        </TabsContent>
        <TabsContent value="assets" className="pt-6">
          <ProductAssetsTab productId={productId} />
        </TabsContent>
        <TabsContent value="print" className="pt-6">
          <ProductPrintAreasTab productId={productId} />
        </TabsContent>
        <TabsContent value="calibration" className="pt-6">
          <ProductCalibrationTab productId={productId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
