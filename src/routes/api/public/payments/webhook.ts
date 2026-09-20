import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";

async function markOrder(orderId: string, status: "paid" | "failed", paymentReference?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("orders").update({
    payment_status: status,
    ...(paymentReference ? { payment_reference: paymentReference } : {}),
  }).eq("id", orderId);
  await supabaseAdmin.from("audit_log").insert({
    entity_type: "orders",
    entity_id: orderId,
    action: status === "paid" ? "payment_confirmed" : "payment_failed",
    after_value: { payment_status: status, payment_reference: paymentReference ?? null },
  });
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const rawEnv = new URL(request.url).searchParams.get("env");
    if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
    try {
      const event = await verifyWebhook(request, rawEnv as StripeEnv);
      const object = event.data.object as {
        id?: string;
        payment_status?: string;
        status?: string;
        metadata?: { orderId?: string };
      };
      const orderId = object.metadata?.orderId;
      if (orderId && ((event.type === "checkout.session.completed" && object.payment_status !== "unpaid") || event.type === "checkout.session.async_payment_succeeded" || event.type === "transaction.completed")) {
        await markOrder(orderId, "paid", object.id);
      }
      if (orderId && (event.type === "checkout.session.async_payment_failed" || event.type === "transaction.payment_failed")) {
        await markOrder(orderId, "failed", object.id);
      }
      return Response.json({ received: true });
    } catch (error) {
      console.error("Payment webhook error", error);
      return new Response("Webhook error", { status: 400 });
    }
  } } },
});