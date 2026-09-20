import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, FileCheck, MessageSquare, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero, Section } from "@/components/site/PageHero";
import { DesignSpec } from "@/components/admin/DesignSpec";
import { OrderPayment } from "@/components/OrderPayment";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import type { DesignSnapshot } from "@/lib/production-spec";

export const Route = createFileRoute("/account/requests/$kind/$id")({
  head: () => ({ meta: [
    { title: "Order Details | Straight Line Printing" },
    { name: "description", content: "Review your private order, quote, proof, design and payment details." },
    { property: "og:title", content: "Order Details | Straight Line Printing" },
    { property: "og:description", content: "Review your private Straight Line Printing project." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: CustomerRequestDetail,
});

function CustomerRequestDetail() {
  const { kind, id } = Route.useParams();
  const { user, loading } = useSession();
  const detail = useQuery({
    queryKey: ["customer-request", kind, id, user?.id],
    enabled: Boolean(user?.id && (kind === "order" || kind === "quote")),
    queryFn: async () => {
      const userId = user?.id;
      if (!userId) throw new Error("Sign in required");
      if (kind === "order") {
        const { data, error } = await supabase.from("orders").select("*, order_items(*), proofs(*)").eq("id", id).eq("user_id", userId).single();
        if (error) throw error;
        const { data: messages } = await supabase.from("request_messages").select("id, body, created_at, author_id").eq("order_id", id).eq("is_internal", false).order("created_at");
        return {
          record: {
            id: data.id, number: data.order_number, status: data.status,
            paymentStatus: data.payment_status, currency: data.currency,
            total: data.total, createdAt: data.created_at, dueDate: data.due_date,
            delivery: formatAddress(data.shipping_address),
            contactName: data.contact_name, contactPhone: data.contact_phone,
            contactEmail: data.contact_email, notes: data.notes,
          },
          items: data.order_items.map((item) => ({ id: item.id, quantity: item.quantity, snapshot: item.frozen_config })),
          proofs: data.proofs,
          messages: messages ?? [],
        };
      }
      const { data, error } = await supabase.from("quotes").select("*, quote_items(*), proofs(*)").eq("id", id).eq("user_id", userId).single();
      if (error) throw error;
      const { data: messages } = await supabase.from("request_messages").select("id, body, created_at, author_id").eq("quote_id", id).eq("is_internal", false).order("created_at");
      return {
        record: {
          id: data.id, number: data.quote_number, status: data.status,
          paymentStatus: null, currency: "CAD", total: data.total,
          createdAt: data.created_at, dueDate: data.due_date ?? data.deadline,
          delivery: data.shipping_destination || "To be confirmed",
          contactName: data.contact_name, contactPhone: data.contact_phone,
          contactEmail: data.contact_email, notes: data.notes,
        },
        items: data.quote_items.map((item) => ({ id: item.id, quantity: item.quantity, snapshot: item.config_snapshot })),
        proofs: data.proofs,
        messages: messages ?? [],
      };
    },
  });

  if (loading) return <Section><p>Loading your project…</p></Section>;
  if (!user) return <Section><div className="border-l-4 border-primary bg-card p-8"><h1 className="display-heading text-3xl">Sign in required</h1><Button asChild className="mt-5"><Link to="/auth">Sign in</Link></Button></div></Section>;
  if (detail.isLoading) return <Section><p>Loading your project…</p></Section>;
  if (detail.isError || !detail.data) return <Section><div className="border-l-4 border-destructive bg-card p-8"><h1 className="display-heading text-3xl">Project not found</h1><p className="mt-2 text-sm text-muted-foreground">This project is unavailable or does not belong to your account.</p></div></Section>;

  const { record, items, proofs, messages } = detail.data;
  const number = record.number;
  const total = new Intl.NumberFormat("en-CA", { style: "currency", currency: record.currency }).format(Number(record.total));
  const unpaid = kind === "order" && record.paymentStatus !== "paid";

  return <>
    {unpaid && <PaymentTestModeBanner />}
    <PageHero eyebrow={kind === "order" ? "Order details" : "Quote details"} title={number} description="Your garment selections, artwork placements, proof status and project activity." />
    <Section>
      <Button asChild variant="ghost" className="mb-5"><Link to="/account"><ArrowLeft className="size-4" /> Back to account</Link></Button>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <section className="border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="display-heading text-2xl">Project summary</h2><Badge variant="outline">{humanize(record.status)}</Badge></div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Total" value={total} /><Info label="Payment" value={kind === "order" ? humanize(record.paymentStatus || "unpaid") : "Quoted after review"} />
              <Info label="Created" value={new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(new Date(record.createdAt))} /><Info label="Due date" value={record.dueDate || "Not scheduled"} />
              <Info label="Delivery" value={record.delivery} /><Info label="Contact name" value={record.contactName || "—"} />
              <Info label="Contact email" value={record.contactEmail || user.email || "—"} /><Info label="Contact phone" value={record.contactPhone || "—"} />
              <Info label="Total units" value={String(items.reduce((sum: number, item: { quantity: number }) => sum + (item.quantity ?? 0), 0))} />
            </dl>
            {record.notes && <p className="mt-4 border-l-2 border-primary pl-3 text-sm">{record.notes}</p>}
          </section>
          <section className="grid gap-4"><h2 className="display-heading flex items-center gap-2 text-2xl"><PackageCheck className="size-5 text-primary" /> Items & designs</h2>{items.map((item) => <DesignSpec key={item.id} snapshot={{ ...(item.snapshot as unknown as DesignSnapshot), quantity: item.quantity }} />)}</section>
          <section className="border border-border bg-card p-5"><h2 className="display-heading flex items-center gap-2 text-2xl"><FileCheck className="size-5 text-primary" /> Proofs</h2><div className="mt-3 grid gap-2">{proofs.length ? proofs.map((proof: { id: string; version: number; status: string; created_at: string }) => <div key={proof.id} className="flex items-center justify-between border border-border p-3 text-sm"><span>Version {proof.version} · {new Date(proof.created_at).toLocaleDateString()}</span><Badge variant="outline">{humanize(proof.status)}</Badge></div>) : <p className="text-sm text-muted-foreground">No proof has been sent yet.</p>}</div></section>
          <section className="border border-border bg-card p-5"><h2 className="display-heading flex items-center gap-2 text-2xl"><MessageSquare className="size-5 text-primary" /> Updates</h2><div className="mt-3 grid gap-3">{messages.length ? messages.map((message: { id: string; body: string; created_at: string }) => <div key={message.id} className="border-l-2 border-primary pl-3 text-sm"><p>{message.body}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p></div>) : <p className="text-sm text-muted-foreground">No customer-visible updates yet.</p>}</div></section>
        </div>
        <aside className="h-fit border border-border bg-card p-5"><h2 className="display-heading text-2xl">Next step</h2>{unpaid ? <><p className="mt-2 text-sm text-muted-foreground">Complete secure payment to move this order into staff review.</p><div className="mt-4"><CreditCard className="mb-3 size-5 text-primary" /><OrderPayment orderId={record.id} /></div></> : <p className="mt-2 text-sm text-muted-foreground">Your project is with our team. We will send a proof before production when required.</p>}</aside>
      </div>
    </Section>
  </>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }

/** Full delivery address exactly as saved on the order. */
function formatAddress(value: unknown) {
  const a = (value ?? {}) as { pickup?: boolean; line1?: string; line2?: string; city?: string; region?: string; postal_code?: string; country?: string };
  if (a.pickup) return "Shop pickup";
  const parts = [a.line1, a.line2, a.city, a.region, a.postal_code, a.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Address not provided";
}
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }