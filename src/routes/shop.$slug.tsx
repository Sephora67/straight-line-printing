import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, Ruler, Truck, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/lib/catalog.functions";
import { garmentImageUrl, money, VIEW_LABEL, VIEW_ORDER, type GarmentView } from "@/lib/garment";
import { addToCart } from "@/lib/cart";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Garment";
    const description =
      loaderData?.description ??
      `${name} ready to decorate with screen printing, DTF or embroidery.`;
    return {
      meta: [
        { title: `${name} | Straight Line Printing` },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: `${name} | Straight Line Printing` },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();

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

  const [colorId, setColorId] = useState(colors[0]?.id ?? "");
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  const [view, setView] = useState<GarmentView>("front");
  const [qty, setQty] = useState(1);

  const color = colors.find((c) => c.id === colorId) ?? colors[0];
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0];

  const assetsForColor = (product.garment_assets ?? []).filter((a) => a.color_id === colorId);
  const availableViews = VIEW_ORDER.filter((v) => assetsForColor.some((a) => a.view === v));
  const shownView = availableViews.includes(view) ? view : (availableViews[0] ?? "front");
  const asset = assetsForColor.find((a) => a.view === shownView);
  const image = garmentImageUrl(asset?.storage_path);

  const variant = (product.product_variants ?? []).find(
    (v) => v.color_id === colorId && v.size_id === sizeId,
  );
  const sizeAdj = Number(size?.price_adjustment ?? 0);
  const unitPrice = Number(variant?.price ?? product.base_price ?? 0) + sizeAdj;

  const printAreas = (product.print_areas ?? []).filter((a) => a.is_active !== false);

  function add() {
    if (!color || !size) {
      toast.error("Choose a colour and a size first");
      return;
    }
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colorName: color.name,
      colorHex: color.hex,
      sizeLabel: size.label,
      quantity: qty,
      unitPrice,
      image,
    });
    toast.success(`${qty} × ${product.name} added`, {
      description: `${color.name} · ${size.label}`,
    });
  }

  return (
    <div className="section-shell py-8 md:py-12">
      <nav className="text-xs uppercase tracking-widest text-muted-foreground">
        <Link to="/shop" className="hover:text-primary">
          Shop
        </Link>
        <span className="px-2">/</span>
        <span>{product.garment_type?.replace(/-/g, " ")}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square border border-border bg-secondary">
            {image ? (
              <img
                src={image}
                alt={`${product.name} — ${color?.name} ${VIEW_LABEL[shownView]}`}
                className="size-full object-contain"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                No photo for this view yet
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {availableViews.map((v) => {
              const a = assetsForColor.find((x) => x.view === v);
              const src = garmentImageUrl(a?.storage_path);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`aspect-square border bg-secondary ${
                    shownView === v ? "border-primary" : "border-border"
                  }`}
                  title={VIEW_LABEL[v]}
                >
                  {src && <img src={src} alt={VIEW_LABEL[v]} className="size-full object-contain" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buy box */}
        <div>
          {product.brand && (
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
              {product.brand}
            </p>
          )}
          <h1 className="display-heading mt-2 text-4xl md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-bold">{money(unitPrice)}</span>
            <span className="text-sm text-muted-foreground">per piece, before decoration</span>
          </div>
          {product.description && (
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-8">
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
                  className={`size-9 rounded-full border-2 transition-transform ${
                    c.id === colorId
                      ? "border-primary scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex ?? "transparent" }}
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-widest">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSizeId(s.id)}
                  className={`min-w-14 border px-4 py-2 text-sm font-bold uppercase ${
                    s.id === sizeId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {sizeAdj > 0 && (
              <p className="mt-2 text-sm font-bold text-primary">
                Size surcharge +{money(sizeAdj)}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center border border-border">
              <button
                type="button"
                className="px-3 py-3"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-12 text-center font-bold">{qty}</span>
              <button
                type="button"
                className="px-3 py-3"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button className="flex-1" onClick={add}>
              Add to cart — {money(unitPrice * qty)}
            </Button>
          </div>

          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/design-studio/$slug" params={{ slug: product.slug }} search={{ from: undefined }}>
              Start designing this blank
            </Link>
          </Button>

          <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
            <Spec icon={<Ruler className="size-4 text-primary" />} label="Print areas">
              {printAreas.length
                ? printAreas
                    .map(
                      (a) =>
                        `${VIEW_LABEL[a.view as GarmentView]} ${a.physical_width_in ?? "?"}″ × ${
                          a.physical_height_in ?? "?"
                        }″`,
                    )
                    .join(" · ")
                : "Spec available on request"}
            </Spec>
            <Spec icon={<Truck className="size-4 text-primary" />} label="Production window">
              2–4 business days after proof approval
            </Spec>
            <Spec icon={<Tag className="size-4 text-primary" />} label="Fabric">
              {[product.fabric, product.weight, product.fit].filter(Boolean).join(" · ") ||
                "Details on request"}
            </Spec>
          </dl>
        </div>
      </div>
    </div>
  );
}

function Spec({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5">{icon}</span>
      <dt className="w-40 shrink-0 text-xs font-bold uppercase tracking-widest">{label}</dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  );
}
