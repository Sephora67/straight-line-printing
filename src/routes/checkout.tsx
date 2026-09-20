import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero, Section } from "@/components/site/PageHero";
import { readCart, type CartLine } from "@/lib/cart";
import { money } from "@/lib/garment";
import { submitOrder } from "@/lib/requests.functions";
import { useSession } from "@/hooks/useSession";
import { VIEW_LABELS, formatIn, placementSentence } from "@/lib/production-spec";
import { OrderPayment } from "@/components/OrderPayment";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Straight Line Printing" },
      {
        name: "description",
        content: "Review your configuration, shipping and taxes before paying for your order.",
      },
      { property: "og:title", content: "Checkout | Straight Line Printing" },
      {
        property: "og:description",
        content: "Review configuration, shipping and taxes before paying.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; number: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal: "",
    notes: "",
  });
  const [fulfilment, setFulfilment] = useState<"pickup" | "ship">("ship");

  useEffect(() => {
    setLines(readCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (user?.email) setForm((f) => (f.email ? f : { ...f, email: user.email ?? "" }));
  }, [user]);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  if (placed) {
    return (
      <>
        <PaymentTestModeBanner />
        <PageHero eyebrow="Secure payment" title={placed.number} description="Complete payment below. Your order remains in staff review after payment." />
        <Section>
          <div className="mx-auto max-w-3xl border border-border bg-card p-3 sm:p-6">
            <OrderPayment orderId={placed.id} />
          </div>
        </Section>
      </>
    );
  }

  if (loaded && lines.length === 0) {
    return (
      <>
        <PageHero eyebrow="Secure checkout" title="Checkout" description="" />
        <Section>
          <div className="max-w-2xl border border-border bg-card p-8">
            <h2 className="display-heading text-3xl">Nothing to check out yet</h2>
            <p className="mt-3 text-sm text-muted-foreground">Your cart is empty.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/design-studio">Design something</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/shop">Browse garments</Link>
              </Button>
            </div>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Secure checkout"
        title="Checkout"
        description="Everything below is exactly what goes to production: garment, colour, size, quantity, placements and measurements."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <form
            className="grid gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (sending) return;
              if (!user) {
                try { sessionStorage.setItem("post_auth_path", "/checkout"); } catch { /* unavailable */ }
                toast.error("Sign in before paying so we can protect your order details");
                void navigate({ to: "/auth" });
                return;
              }
              const missing = lines.filter((l) => !l.snapshot);
              if (missing.length) {
                toast.error("Some items were saved before the studio update", {
                  description: "Open them in the Design Studio again so we get the full spec.",
                });
                return;
              }
              const completeLines = lines.flatMap((line) => line.snapshot ? [{
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                snapshot: { ...line.snapshot, quantity: line.quantity },
              }] : []);
              setSending(true);
              try {
                const result = await submitOrder({
                  data: {
                    contactName: form.name,
                    contactEmail: form.email,
                    contactPhone: form.phone,
                    notes: form.notes,
                    fulfilment,
                    address:
                      fulfilment === "ship"
                        ? { line1: form.address, city: form.city, postal_code: form.postal }
                        : { pickup: true },
                    items: completeLines,
                  },
                });
                setPlaced({ id: result.orderId, number: result.orderNumber });
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setSending(false);
              }
            }}
          >
            <section className="border border-border bg-card p-5">
              <h2 className="display-heading text-2xl">Your details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="co-name">Name</Label>
                  <Input
                    id="co-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="co-email">Email</Label>
                  <Input
                    id="co-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="co-phone">Phone</Label>
                  <Input
                    id="co-phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="border border-border bg-card p-5">
              <h2 className="display-heading text-2xl">Delivery</h2>
              <div className="mt-4 flex gap-2">
                {(["ship", "pickup"] as const).map((f) => (
                  <Button
                    key={f}
                    type="button"
                    variant={fulfilment === f ? "default" : "outline"}
                    onClick={() => setFulfilment(f)}
                  >
                    {f === "ship" ? "Ship to me" : "Shop pickup"}
                  </Button>
                ))}
              </div>
              {fulfilment === "ship" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="co-addr">Address</Label>
                    <Input
                      id="co-addr"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="co-city">City</Label>
                    <Input
                      id="co-city"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="co-postal">Postal code</Label>
                    <Input
                      id="co-postal"
                      required
                      value={form.postal}
                      onChange={(e) => setForm({ ...form, postal: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="mt-4 grid gap-2">
                <Label htmlFor="co-notes">Anything we should know</Label>
                <Textarea
                  id="co-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </section>

            <section className="border border-border bg-card p-5">
              <h2 className="display-heading text-2xl">What goes to production</h2>
              <div className="mt-4 grid gap-4">
                {lines.map((l) => (
                  <div key={l.id} className="border-l-2 border-primary pl-3 text-sm">
                    <p className="font-semibold">
                      {l.name} · {l.colorName} · {l.sizeLabel} · {l.quantity} pcs
                    </p>
                    {(l.snapshot?.placements ?? []).map((p) => (
                      <div key={p.view} className="mt-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {VIEW_LABELS[p.view]} · print area{" "}
                          {formatIn(p.areaWidthIn)} × {formatIn(p.areaHeightIn)}
                        </p>
                        {p.layers.map((layer) => (
                          <p key={layer.id}>{placementSentence(p, layer)}</p>
                        ))}
                      </div>
                    ))}
                    {!l.snapshot && (
                      <p className="text-primary">
                        Saved before the latest studio update — re-open it in the Design Studio.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={sending}>
              {sending ? "Preparing payment…" : user ? "Continue to secure payment" : "Sign in to pay"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Card details are handled by our payment provider and never stored in this website.
              After payment, your order stays in staff review before proofing or production.
            </p>
          </form>

          <aside className="h-fit border border-border bg-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Summary
            </h2>
            <div className="mt-3 grid gap-2 text-sm">
              {lines.map((l) => (
                <div key={l.id} className="flex justify-between gap-3">
                  <span className="truncate">
                    {l.name} × {l.quantity}
                  </span>
                  <span className="font-semibold">{money(l.unitPrice * l.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-3">
              <span className="font-bold uppercase tracking-widest">Subtotal</span>
              <span className="display-heading text-2xl">{money(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Shipping and tax are confirmed on your order confirmation.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/cart">Back to cart</Link>
            </Button>
            <button
              type="button"
              className="mt-2 w-full text-xs text-muted-foreground hover:underline"
              onClick={() => void navigate({ to: "/shop" })}
            >
              Continue shopping
            </button>
          </aside>
        </div>
      </Section>
    </>
  );
}
