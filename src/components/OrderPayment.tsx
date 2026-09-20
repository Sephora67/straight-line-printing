import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useCallback } from "react";
import { createOrderCheckout } from "@/lib/payments.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

export function OrderPayment({ orderId }: { orderId: string }) {
  const fetchClientSecret = useCallback(async () => {
    const result = await createOrderCheckout({
      data: {
        orderId,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/checkout/return?order_id=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Payment form could not be started");
    return result.clientSecret;
  }, [orderId]);

  return (
    <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}