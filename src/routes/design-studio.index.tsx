import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/PageHero";
import { listPublishedProducts } from "@/lib/catalog.functions";
import { garmentImageUrl, money } from "@/lib/garment";
import { Copy } from "@/lib/site-copy";

export const Route = createFileRoute("/design-studio/")({
  head: () => ({
    meta: [
      { title: "Design Studio | Straight Line Printing" },
      {
        name: "description",
        content:
          "Design your garment online: pick a colour, upload artwork, position it on front, back or sleeves and see it before you order.",
      },
      { property: "og:title", content: "Design Studio | Straight Line Printing" },
      {
        property: "og:description",
        content: "Upload artwork, place it on the garment and preview every view before ordering.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesignStudio,
});

function DesignStudio() {
  const products = useQuery({ queryKey: ["products"], queryFn: () => listPublishedProducts() });

  return (
    <>
      <PageHero
        eyebrow="Customise online"
        title="Design Studio"
        description="Choose a garment and colour, drop your artwork onto the print area, and switch between front, back and sleeves to check it."
        copyId="studio.hero"
      />

      <div className="section-shell py-12">
        <Copy as="h2" id="studio.list.title" className="display-heading block text-3xl">Start with a garment</Copy>
        {products.isLoading && <p className="mt-4 text-muted-foreground">Loading garments…</p>}

        {products.data && products.data.length === 0 && (
          <div className="mt-6 border border-dashed border-border p-12 text-center">
            <p className="mx-auto max-w-md text-muted-foreground">
              No garments are published yet. Once products are published from the admin dashboard
              they appear here automatically with their colours and print areas.
            </p>
            <Button asChild className="mt-6">
              <Link to="/quote-request">Send us your project instead</Link>
            </Button>
          </div>
        )}

        {products.data && products.data.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.data.map((p) => {
              const colors = [...(p.product_colors ?? [])].sort(
                (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
              );
              const asset =
                (p.garment_assets ?? []).find(
                  (a) => a.view === "front" && a.color_id === colors[0]?.id,
                ) ?? (p.garment_assets ?? []).find((a) => a.view === "front");
              const img = garmentImageUrl(asset?.storage_path);
              return (
                <Link
                  key={p.id}
                  to="/design-studio/$slug"
                  params={{ slug: p.slug }}
                  search={{ from: undefined }}
                  className="group border border-border bg-card transition-colors hover:border-primary"
                >
                  <div className="aspect-square overflow-hidden bg-secondary">
                    {img && (
                      <img
                        src={img}
                        alt={`${p.name} front view`}
                        loading="lazy"
                        className="size-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="display-heading text-2xl">{p.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {colors.length} colours · from {money(p.base_price)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {colors.slice(0, 8).map((c) => (
                        <span
                          key={c.id}
                          title={c.name}
                          className="size-5 rounded-full border border-border"
                          style={{ backgroundColor: c.hex ?? "transparent" }}
                        />
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
