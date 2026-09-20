import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { listPublishedProducts, listCategories } from "@/lib/catalog.functions";
import { garmentImageUrl, money } from "@/lib/garment";
import { Copy } from "@/lib/site-copy";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop Blank & Custom Garments | Straight Line Printing" },
      {
        name: "description",
        content:
          "Browse t-shirts, hoodies, sweatshirts and hi-vis vests ready to customise with screen printing, DTF or embroidery.",
      },
      { property: "og:title", content: "Shop Custom Garments | Straight Line Printing" },
      {
        property: "og:description",
        content: "Browse garments ready to customise with printing or embroidery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const products = useQuery({ queryKey: ["products"], queryFn: () => listPublishedProducts() });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const [type, setType] = useState<string>("all");

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const p of products.data ?? []) if (p.garment_type) set.add(p.garment_type);
    return [...set].sort();
  }, [products.data]);

  const visible = (products.data ?? []).filter((p) => type === "all" || p.garment_type === type);

  return (
    <>
      <PageHero
        eyebrow="Catalogue"
        title="Shop"
        description="Every garment here is set up for decoration: real colour photos, defined print areas and calibrated placement."
        copyId="shop.hero"
      />

      <div className="section-shell py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <FilterChip active={type === "all"} onClick={() => setType("all")}>
            <Copy id="shop.filter.all">All garments</Copy>
          </FilterChip>
          {types.map((t) => (
            <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
              {t.replace(/-/g, " ")}
            </FilterChip>
          ))}
          {categories.data?.length ? (
            <span className="ml-auto text-xs uppercase tracking-widest text-muted-foreground">
              {visible.length} styles
            </span>
          ) : null}
        </div>

        {products.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse border border-border">
                <div className="aspect-square bg-secondary" />
                <div className="h-28 bg-card" />
              </div>
            ))}
          </div>
        )}

        {products.data && visible.length === 0 && (
          <div className="border border-dashed border-border p-12 text-center">
            <Copy as="h2" id="shop.empty.title" className="display-heading block text-3xl">Nothing published in this category yet</Copy>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Garments are added and published from the admin dashboard. In the meantime, tell us
              what you need and we will quote it.
            </p>
            <Button asChild className="mt-6">
              <Link to="/quote-request">Request a quote</Link>
            </Button>
          </div>
        )}

        {visible.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => {
              const colors = [...(p.product_colors ?? [])].sort(
                (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
              );
              const first = colors[0];
              const asset =
                (p.garment_assets ?? []).find(
                  (a) => a.view === "front" && a.color_id === first?.id,
                ) ?? (p.garment_assets ?? []).find((a) => a.view === "front");
              const img = garmentImageUrl(asset?.storage_path);
              return (
                <Link
                  key={p.id}
                  to="/shop/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col border border-border bg-card transition-colors hover:border-primary"
                >
                  <div className="relative aspect-square overflow-hidden bg-secondary">
                    {img ? (
                      <img
                        src={img}
                        alt={`${p.name} front view`}
                        loading="lazy"
                        className="size-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <span className="absolute left-0 top-0 bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-foreground">
                      {p.garment_type?.replace(/-/g, " ") ?? "Garment"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    {p.brand && (
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {p.brand}
                      </p>
                    )}
                    <h2 className="display-heading mt-1 text-2xl">{p.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {colors.slice(0, 10).map((c) => (
                        <span
                          key={c.id}
                          title={c.name}
                          className="size-4 rounded-full border border-border"
                          style={{ backgroundColor: c.hex ?? "transparent" }}
                        />
                      ))}
                      {colors.length > 10 && (
                        <span className="text-[11px] text-muted-foreground">
                          +{colors.length - 10}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-4">
                      <span className="font-bold">From {money(p.base_price)}</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        Customise →
                      </span>
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
