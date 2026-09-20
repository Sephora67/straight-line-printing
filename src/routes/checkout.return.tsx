import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHero, Section } from "@/components/site/PageHero";
import { clearCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>) => ({
    order_id: typeof search["order_id"] === "string" ? search["order_id"] : undefined,
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Payment Received | Straight Line Printing" },
    { name: "description", content: "Your payment was received and your apparel order is ready for staff review." },
    { property: "og:title", content: "Payment Received | Straight Line Printing" },
    { property: "og:description", content: "Your payment was received and your order is ready for review." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { order_id: orderId, session_id: sessionId } = Route.useSearch();
  useEffect(() => {
    if (sessionId) clearCart();
  }, [sessionId]);
  return <>
    <PageHero eyebrow="Payment submitted" title="Thank you" description="Your payment is being confirmed. Your order remains in staff review before proofing and production." />
    <Section>
      <div className="max-w-2xl border-l-4 border-primary bg-card p-8">
        <h1 className="display-heading text-3xl">Payment received</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {sessionId ? "We are confirming the payment now." : "Payment details were not returned."} You can follow the order from your account.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {orderId ? <Button asChild><Link to="/account/requests/$kind/$id" params={{ kind: "order", id: orderId }}>View order</Link></Button> : <Button asChild><Link to="/account">Open account</Link></Button>}
          <Button asChild variant="outline"><Link to="/shop">Keep shopping</Link></Button>
        </div>
      </div>
    </Section>
  </>;
}