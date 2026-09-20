import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
) {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid customer");
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data[0]) return found.data[0].id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data[0]) {
      await stripe.customers.update(existing.data[0].id, {
        metadata: { ...existing.data[0].metadata, userId: options.userId },
      });
      return existing.data[0].id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email ? { email: options.email } : {}),
    metadata: { userId: options.userId },
  });
  return created.id;
}

export const createOrderCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; environment: StripeEnv; returnUrl: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      const { data: order, error } = await context.supabase
        .from("orders")
        .select("id, order_number, total, currency, contact_email, payment_status")
        .eq("id", data.orderId)
        .eq("user_id", context.userId)
        .single();
      if (error || !order) throw new Error("Order not found");
      if (order.payment_status === "paid") throw new Error("This order is already paid");
      const amount = Math.round(Number(order.total) * 100);
      if (amount < 50) throw new Error("Order total must be at least $0.50");

      const stripe = createStripeClient(data.environment);
      const customer = await resolveOrCreateCustomer(stripe, {
        userId: context.userId,
        ...(order.contact_email ? { email: order.contact_email } : {}),
      });
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: (order.currency || "cad").toLowerCase(),
            unit_amount: amount,
            product_data: { name: `Straight Line Printing order ${order.order_number}`, tax_code: "txcd_20030000" },
          },
          quantity: 1,
        }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer,
        automatic_tax: { enabled: true },
        payment_intent_data: { description: `Straight Line Printing order ${order.order_number}` },
        metadata: { userId: context.userId, orderId: order.id, orderNumber: order.order_number },
      });
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });