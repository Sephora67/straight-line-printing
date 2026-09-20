import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { submitRequest } from "@/lib/requests.functions";
import { Copy } from "@/lib/site-copy";

export const Route = createFileRoute("/quote-request")({
  head: () => ({
    meta: [
      { title: "Request a Quote | Straight Line Printing" },
      {
        name: "description",
        content:
          "Request a custom apparel quote: garments, colours, sizes, quantities, decoration method, artwork and your deadline.",
      },
      { property: "og:title", content: "Request a Custom Apparel Quote" },
      {
        property: "og:description",
        content: "Send us your garments, quantities, artwork and deadline for full pricing.",
      },
    ],
  }),
  component: QuoteRequest,
});

function QuoteRequest() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  return (
    <>
      <PageHero
        eyebrow="Bulk & custom projects"
        title="Request a Quote"
        description="Give us the details and we will come back with garment pricing, decoration, setup, rush options, shipping and tax."
        copyId="quote.hero"
      />

      <Section>
        <form
          className="grid max-w-3xl gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (sending) return;
            const f = new FormData(e.currentTarget);
            const get = (k: string) => String(f.get(k) ?? "").trim();
            setSending(true);
            try {
              const result = await submitRequest({
                data: {
                  requestType: "quote",
                  decorationMethod: get("method") || "unsure",
                  contactName: get("name"),
                  contactEmail: get("email"),
                  contactPhone: get("phone"),
                  company: get("company"),
                  deadline: get("deadline") || null,
                  notes: [
                    `Quantity: ${get("quantity") || "not specified"}`,
                    `Ship to: ${get("shipping") || "not specified"}`,
                    `Garments / sizes: ${get("breakdown")}`,
                    `Placements & artwork: ${get("notes")}`,
                  ].join("\n"),
                  items: [],
                },
              });
              setSent(result.quoteNumber);
              toast.success(`Request ${result.quoteNumber} sent`);
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setSending(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name"><Copy id="quote.label.name">Your name</Copy></Label>
              <Input id="name" name="name" required placeholder="Jane Tremblay" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company"><Copy id="quote.label.company">Company or team</Copy></Label>
              <Input id="company" name="company" placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email"><Copy id="quote.label.email">Email</Copy></Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone"><Copy id="quote.label.phone">Phone</Copy></Label>
              <Input id="phone" name="phone" placeholder="Optional" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="method"><Copy id="quote.label.method">Decoration method</Copy></Label>
              <Select name="method">
                <SelectTrigger id="method">
                  <SelectValue placeholder="Choose a method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screen">Screen Printing</SelectItem>
                  <SelectItem value="dtf">DTF Printing</SelectItem>
                  <SelectItem value="transfers">DTF Transfers / Sheets</SelectItem>
                  <SelectItem value="embroidery">Embroidery</SelectItem>
                  <SelectItem value="unsure">Not sure yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity"><Copy id="quote.label.quantity">Total quantity</Copy></Label>
              <Input id="quantity" name="quantity" type="number" min={1} placeholder="e.g. 150" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline"><Copy id="quote.label.deadline">In-hands deadline</Copy></Label>
              <Input id="deadline" name="deadline" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipping"><Copy id="quote.label.shipping">Ship to</Copy></Label>
              <Input id="shipping" name="shipping" placeholder="City, province/state" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="breakdown"><Copy id="quote.label.breakdown">Garments, colours and size breakdown</Copy></Label>
            <Textarea
              id="breakdown" name="breakdown"
              rows={4}
              placeholder={"e.g. Gildan 5000 Black: S 10, M 25, L 40, XL 20\nWhite: M 15, L 20"}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes"><Copy id="quote.label.notes">Print locations, artwork and anything else</Copy></Label>
            <Textarea
              id="notes" name="notes"
              rows={4}
              placeholder="Front full print, 2 colours. Left sleeve 1 colour. Artwork is vector."
            />
          </div>

          <div>
            <Button type="submit" size="lg" disabled={sending}>
              {sending ? "Sending…" : <Copy id="quote.submit">Send quote request</Copy>}
            </Button>
            {sent && (
              <p className="mt-3 border-l-2 border-primary pl-3 text-sm font-semibold">
                Request {sent} received — keep this number to track the status.
              </p>
            )}
            <Copy as="p" id="quote.footnote" className="mt-3 block text-xs text-muted-foreground">
              Want to show us the placement? Build it in the Design Studio and it arrives with full measurements attached.
            </Copy>
          </div>
        </form>
      </Section>
    </>
  );
}
