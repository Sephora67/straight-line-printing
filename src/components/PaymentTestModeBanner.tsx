export function PaymentTestModeBanner() {
  const token = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];
  if (!token) {
    return (
      <div className="w-full border-b border-destructive bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Live checkout is not configured yet. Complete payment setup before accepting real orders.
      </div>
    );
  }
  if (token.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-primary/30 bg-primary/10 px-4 py-2 text-center text-sm text-foreground">
        Test payment mode — no real charge will be made.
      </div>
    );
  }
  return null;
}