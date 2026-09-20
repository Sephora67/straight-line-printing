import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Section } from "@/components/site/PageHero";
import { money } from "@/lib/garment";
import { readCart, removeLine, updateQuantity, type CartLine } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart | Straight Line Printing" },
      {
        name: "description",
        content: "Review your custom apparel configurations before checkout.",
      },
      { property: "og:title", content: "Cart | Straight Line Printing" },
      { property: "og:description", content: "Review your custom apparel order before checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cart,
});

function Cart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener("slp-cart-change", sync);
    return () => window.removeEventListener("slp-cart-change", sync);
  }, []);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <>
      <PageHero eyebrow="Your order" title="Cart" />
      <Section>
        {lines.length === 0 ? (
          <div className="flex flex-col items-center border border-dashed border-border p-16 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" />
            <h2 className="display-heading mt-4 text-3xl">Your cart is empty</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Configure a garment in the Design Studio and add it here, or send a bulk project
              through a quote request.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/design-studio">Start designing</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/shop">Browse the shop</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <ul className="divide-y divide-border border-y border-border">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-4 py-4">
                  <div className="size-24 shrink-0 border border-border bg-secondary">
                    {l.image && (
                      <img src={l.image} alt={l.name} className="size-full object-contain" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/shop/$slug"
                      params={{ slug: l.slug }}
                      className="display-heading text-xl hover:text-primary"
                    >
                      {l.name}
                    </Link>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {l.colorName} · {l.sizeLabel}
                      {l.designNote ? ` · ${l.designNote}` : ""}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-border">
                        <button
                          type="button"
                          className="px-2 py-1"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(l.id, l.quantity - 1)}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{l.quantity}</span>
                        <button
                          type="button"
                          className="px-2 py-1"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(l.id, l.quantity + 1)}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary"
                        aria-label="Remove item"
                        onClick={() => removeLine(l.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <span className="font-bold">{money(l.unitPrice * l.quantity)}</span>
                </li>
              ))}
            </ul>

            <aside className="h-fit border border-border bg-card p-5">
              <h2 className="display-heading text-2xl">Summary</h2>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{money(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Taxes and shipping are confirmed at checkout. Decoration is quoted on your proof.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link to="/checkout">Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link to="/quote-request">Request a bulk quote instead</Link>
              </Button>
            </aside>
          </div>
        )}
      </Section>
    </>
  );
}
