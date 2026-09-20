import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, published, quotes, orders] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
        supabase.from("quotes").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);
      return {
        products: products.count ?? 0,
        published: published.count ?? 0,
        quotes: quotes.count ?? 0,
        orders: orders.count ?? 0,
      };
    },
  });

  const cards = [
    ["Products", stats.data?.products],
    ["Published", stats.data?.published],
    ["Quotes", stats.data?.quotes],
    ["Orders", stats.data?.orders],
  ] as const;

  return (
    <div>
      <h1 className="display-heading text-4xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="display-heading mt-2 text-4xl">{value ?? "–"}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 border-l-4 border-primary bg-secondary p-6">
        <h2 className="display-heading text-2xl">Start your catalogue</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a garment, add its colours, sizes and images, set the print areas, then publish it.
        </p>
        <Button asChild className="mt-4">
          <Link to="/admin/products">Manage products</Link>
        </Button>
      </div>
    </div>
  );
}
