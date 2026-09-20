import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoles } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  FileImage,
  FileText,
  Image,
  PackageCheck,
  Palette,
  Save,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Your Account | Straight Line Printing" },
      {
        name: "description",
        content:
          "Track orders, review quotes, approve proofs, reopen saved designs and download your documents.",
      },
      { property: "og:title", content: "Your Account | Straight Line Printing" },
      {
        property: "og:description",
        content: "Orders, quotes, proofs and saved designs in one place.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const { session, isStaff, loading } = useRoles();

  return (
    <>
      <PageHero
        eyebrow="Customer portal"
        title={session?.user.user_metadata?.["full_name"] || "Your Account"}
        description="Track every quote, order, proof, artwork file and saved design from one place."
      />
      <Section>
        <AccountPanel session={session} isStaff={isStaff} loading={loading} />
      </Section>
    </>
  );
}

function AccountPanel({
  session,
  isStaff,
  loading,
}: {
  session: ReturnType<typeof useRoles>["session"];
  isStaff: boolean;
  loading: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const portal = useQuery({
    queryKey: ["customer-portal", session?.user.id],
    enabled: Boolean(session?.user.id),
    queryFn: async () => {
      const userId = session?.user.id;
      if (!userId) throw new Error("Sign in required");
      const [profile, quotes, orders, designs, artworks, proofs] = await Promise.all([
        supabase.from("profiles").select("full_name, company, email, phone").eq("id", userId).maybeSingle(),
        supabase.from("quotes").select("id, quote_number, status, total, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(6),
        supabase.from("orders").select("id, order_number, status, payment_status, total, currency, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(6),
        supabase.from("designs").select("id, name, is_saved, updated_at").eq("user_id", userId).eq("is_saved", true).order("updated_at", { ascending: false }).limit(6),
        supabase.from("artworks").select("id, original_filename, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(6),
        supabase.from("proofs").select("id, version, status, created_at, order_id, quote_id").order("created_at", { ascending: false }).limit(6),
      ]);
      const failure = [profile, quotes, orders, designs, artworks, proofs].find((result) => result.error);
      if (failure?.error) throw failure.error;
      return {
        profile: profile.data,
        quotes: quotes.data ?? [],
        orders: orders.data ?? [],
        designs: designs.data ?? [],
        artworks: artworks.data ?? [],
        proofs: proofs.data ?? [],
      };
    },
  });

  if (loading) {
    return <p className="mt-10 text-sm text-muted-foreground">Loading your account…</p>;
  }

  if (!session) {
    return (
      <div className="mt-10 border-l-4 border-primary bg-secondary p-8">
        <h2 className="display-heading text-3xl">Sign in to your account</h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Sign in to review quotes, approve proofs and reopen saved designs.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/quote-request">Request a quote</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (portal.isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-none" />)}
      </div>
    );
  }

  if (portal.isError) {
    return (
      <div className="border-l-4 border-destructive bg-secondary p-8">
        <h2 className="display-heading text-3xl">We couldn't load your projects</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your login is active. Refresh the page to try loading your portal again.</p>
      </div>
    );
  }

  const data = portal.data;
  if (!data) return null;

  const panels = [
    { title: "Quotes", count: data.quotes.length, icon: FileText },
    { title: "Orders", count: data.orders.length, icon: PackageCheck },
    { title: "Proofs", count: data.proofs.length, icon: Image },
    { title: "Saved designs", count: data.designs.length, icon: Save },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {panels.map(({ title, count, icon: Icon }) => (
          <div key={title} className="border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <Icon className="size-6 text-primary" />
              <span className="display-heading text-4xl">{count}</span>
            </div>
            <p className="mt-4 text-sm font-semibold">{title}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-8">
          <PortalList title="Recent orders" icon={PackageCheck} empty="You don't have any orders yet." actionLabel="Shop apparel" actionTo="/shop">
            {data.orders.map((order) => (
              <PortalRow key={order.id} title={`Order ${order.order_number}`} date={order.created_at} status={order.status} detail={`${money(order.total, order.currency)} · ${humanize(order.payment_status)}`} to={{ kind: "order", id: order.id }} />
            ))}
          </PortalList>

          <PortalList title="Quotes" icon={FileText} empty="No quotes yet. Tell us what you need and we'll price it." actionLabel="Request a quote" actionTo="/quote-request">
            {data.quotes.map((quote) => (
              <PortalRow key={quote.id} title={`Quote ${quote.quote_number}`} date={quote.created_at} status={quote.status} detail={money(quote.total, "CAD")} to={{ kind: "quote", id: quote.id }} />
            ))}
          </PortalList>

          <PortalList title="Proofs" icon={Image} empty="Proofs will appear here when artwork is ready for your review.">
            {data.proofs.map((proof) => (
              <PortalRow key={proof.id} title={`Artwork proof · Version ${proof.version}`} date={proof.created_at} status={proof.status} detail={proof.order_id ? "Linked to an order" : "Linked to a quote"} {...(proof.order_id ? { to: { kind: "order" as const, id: proof.order_id } } : proof.quote_id ? { to: { kind: "quote" as const, id: proof.quote_id } } : {})} />
            ))}
          </PortalList>
        </div>

        <aside className="space-y-6">
          <div className="border border-border bg-card p-6">
            <p className="text-xs font-bold uppercase text-muted-foreground">Account</p>
            <h2 className="display-heading mt-2 text-3xl">{data.profile?.full_name || session.user.user_metadata?.["full_name"] || "Customer"}</h2>
            {data.profile?.company && <p className="mt-1 text-sm font-medium">{data.profile.company}</p>}
            <p className="mt-3 break-all text-sm text-muted-foreground">{data.profile?.email || session.user.email}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {isStaff && <Button asChild size="sm"><Link to="/admin">Admin dashboard</Link></Button>}
              <Button size="sm" variant="outline" onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await supabase.auth.signOut();
                navigate({ to: "/auth", replace: true });
              }}>Sign out</Button>
            </div>
          </div>

          <PortalList title="Saved designs" icon={Palette} empty="Start a design and save it to continue later." actionLabel="Open Design Studio" actionTo="/design-studio">
            {data.designs.map((design) => <PortalRow key={design.id} title={design.name || "Untitled design"} date={design.updated_at} status="Saved" />)}
          </PortalList>

          <PortalList title="Artwork" icon={FileImage} empty="Your uploaded artwork files will appear here.">
            {data.artworks.map((artwork) => <PortalRow key={artwork.id} title={artwork.original_filename} date={artwork.created_at} status={artwork.status} />)}
          </PortalList>
        </aside>
      </div>
    </div>
  );
}

function PortalList({ title, icon: Icon, empty, actionLabel, actionTo, children }: {
  title: string;
  icon: typeof Shirt;
  empty: string;
  actionLabel?: string;
  actionTo?: "/shop" | "/quote-request" | "/design-studio";
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);
  return (
    <section className="border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Icon className="size-5 text-primary" />
        <h2 className="display-heading text-2xl">{title}</h2>
      </div>
      {hasItems ? <div className="divide-y divide-border">{children}</div> : (
        <div className="p-5">
          <p className="text-sm text-muted-foreground">{empty}</p>
          {actionLabel && actionTo && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to={actionTo}>{actionLabel}<ArrowRight className="size-4" /></Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function PortalRow({ title, date, status, detail, to }: { title: string; date: string; status: string; detail?: string; to?: { kind: "order" | "quote"; id: string } }) {
  const content = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(date))}{detail ? ` · ${detail}` : ""}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{humanize(status)}</Badge>
        {to && (
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary">
            View details <ArrowRight className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
  return to ? (
    <Link
      to="/account/requests/$kind/$id"
      params={to}
      className="block min-h-16 px-5 py-5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  ) : (
    <div className="px-5 py-4">{content}</div>
  );
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(value);
}
