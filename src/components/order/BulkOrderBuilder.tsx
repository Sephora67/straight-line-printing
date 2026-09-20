import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, ImagePlus, PenTool, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepBlock } from "@/components/order/DtfSheetBuilder";
import { listPublishedProducts } from "@/lib/catalog.functions";
import { garmentImageUrl, money } from "@/lib/garment";
import {
  EMPTY_BULK_DRAFT,
  fileToDataUrl,
  readBulkDraft,
  writeBulkDraft,
  type BulkDraft,
} from "@/lib/bulk-draft";
import { cn } from "@/lib/utils";
import { submitRequest, lookupRequest } from "@/lib/requests.functions";
import type { DesignSnapshot } from "@/lib/production-spec";
import { Copy } from "@/lib/site-copy";

const METHODS = [
  { key: "dtf", name: "DTF", min: 12, body: "Detailed full colour, ideal for smaller runs." },
  { key: "screen", name: "Screen printing", min: 50, body: "Solid colours and volume production." },
  { key: "embroidery", name: "Embroidery", min: 50, body: "Durable, premium textile finish." },
];

export function BulkOrderBuilder() {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextStepRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<BulkDraft>(EMPTY_BULK_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentNumber, setSentNumber] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<string | null>(null);
  const products = useQuery({ queryKey: ["products"], queryFn: () => listPublishedProducts() });

  useEffect(() => {
    setDraft(readBulkDraft());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) writeBulkDraft(draft);
  }, [draft, loaded]);

  const patch = (next: Partial<BulkDraft>) => setDraft((d) => ({ ...d, ...next }));

  const { method, supply, productId: selectedProduct, art, designs, fields } = draft;

  const chosen = METHODS.find((m) => m.key === method) ?? {
    key: "dtf",
    name: "DTF",
    min: 12,
    body: "Detailed full colour, ideal for smaller runs.",
  };

  const chosenProduct = products.data?.find((p) => p.id === selectedProduct);
  const designStep = supply === "us" ? "Step 04" : "Step 03";
  const infoStep = supply === "us" ? "Step 05" : "Step 04";

  function chooseSupply(next: "us" | "you") {
    patch({ supply: next, ...(next === "you" ? { productId: null } : {}) });
    window.setTimeout(() => nextStepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const next = await Promise.all(
      Array.from(list).map(async (f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        url: await fileToDataUrl(f),
      })),
    );
    if (next.length) setDraft((d) => ({ ...d, art: [...d.art, ...next] }));
  }

  return (
    <div className="section-shell grid gap-14 py-12">
      <StepBlock index="Step 01" eyebrow="Print process" title="Which process do you want?" copyId="bulk.step01">
        <Copy as="p" id="bulk.step01.body" className="block max-w-xl text-sm text-muted-foreground">
          The minimum applies per design and per product. Pick the process that matches your run.
        </Copy>
        <div className="mt-4 grid gap-3">
          {METHODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => patch({ method: m.key })}
              aria-pressed={method === m.key}
              className={cn(
                "rounded-md border p-4 text-left transition",
                method === m.key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <Copy id={`bulk.method.${m.key}.name`} className="text-lg font-bold">
                  {m.name}
                </Copy>
                <span className="text-sm font-bold text-primary">MIN. {m.min}</span>
              </div>
              <Copy as="p" id={`bulk.method.${m.key}.body`} className="mt-1 block text-sm text-muted-foreground">
                {m.body}
              </Copy>
            </button>
          ))}
        </div>
      </StepBlock>

      <StepBlock index="Step 02" eyebrow="Garment supply" title="Who supplies the garments?" copyId="bulk.step02">
        <div className="grid gap-3">
          <SupplyCard
            active={supply === "us"}
            onClick={() => chooseSupply("us")}
            copyId="bulk.supply.us"
            eyebrow="Option A / Straight Line supplies"
            title="Choose our blank garments"
            body="Pick t-shirts, hoodies or other catalogue products. We supply them and apply your design to each garment."
            action={supply === "us" ? "Option selected — continue below" : "Choose this option"}
          />
          <SupplyCard
            active={supply === "you"}
            onClick={() => chooseSupply("you")}
            copyId="bulk.supply.you"
            eyebrow="Option B / You supply"
            title="Bring your own garments"
            body="Already have your t-shirts, hoodies or products? Ask for a printing-only quote and skip the catalogue."
            action={supply === "you" ? "Option selected — continue below" : "Choose this option"}
          />
        </div>
      </StepBlock>

      {supply === "us" && (
        <div ref={nextStepRef} className="scroll-mt-28">
          <StepBlock index="Step 03" eyebrow="Garment catalogue" title="Choose your blank garment." copyId="bulk.step03">
            {products.isLoading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="animate-pulse border border-border">
                    <div className="aspect-square bg-secondary" />
                    <div className="h-24 bg-card" />
                  </div>
                ))}
              </div>
            )}
            {products.data?.length === 0 && (
              <p className="border border-dashed border-border p-8 text-center text-muted-foreground">
                No blank garments are published yet.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.data?.map((product) => {
                const colors = [...(product.product_colors ?? [])].sort(
                  (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
                );
                const firstColor = colors[0];
                const asset =
                  (product.garment_assets ?? []).find(
                    (item) => item.view === "front" && item.color_id === firstColor?.id,
                  ) ?? (product.garment_assets ?? []).find((item) => item.view === "front");
                const image = garmentImageUrl(asset?.storage_path);
                const selected = selectedProduct === product.id;
                return (
                  <Button
                    key={product.id}
                    type="button"
                    variant="outline"
                    aria-pressed={selected}
                    onClick={() => patch({ productId: product.id })}
                    className={cn(
                      "group relative h-auto min-w-0 flex-col items-stretch overflow-hidden rounded-none p-0 text-left",
                      selected ? "border-primary ring-2 ring-primary" : "border-border",
                    )}
                  >
                    <span className="relative block aspect-square bg-secondary">
                      {image && (
                        <img
                          src={image}
                          alt={`${product.name} front view`}
                          loading="lazy"
                          className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      {selected && (
                        <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-4" />
                        </span>
                      )}
                    </span>
                    <span className="grid gap-1 p-4">
                      <span className="text-xs font-bold uppercase text-muted-foreground">
                        {product.brand ?? product.garment_type?.replace(/-/g, " ") ?? "Garment"}
                      </span>
                      <span className="whitespace-normal text-base font-bold text-foreground">{product.name}</span>
                      <span className="text-sm text-muted-foreground">From {money(product.base_price)}</span>
                    </span>
                  </Button>
                );
              })}
            </div>
          </StepBlock>
        </div>
      )}

      {supply && (
        <div ref={supply === "you" ? nextStepRef : undefined} className="scroll-mt-28">
          <StepBlock
            index={designStep}
            eyebrow="Your design"
            title="Design the garment."
            copyId="bulk.stepDesign"
            aside={art.length || designs.length ? `${art.length + designs.length} saved` : undefined}
          >
            <div className="grid gap-5">
              {designs.length > 0 && (
                <div className="grid gap-3 rounded-md border border-primary/40 bg-primary/5 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Designs saved from the studio
                  </p>
                  <ul className="grid gap-3">
                    {designs.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-2">
                        {d.image && (
                          <img src={d.image} alt={d.name} className="size-12 rounded bg-muted object-contain" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{d.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {d.colorName} · {d.sizeLabel} · {d.views}
                          </span>
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove design for ${d.name}`}
                          onClick={() =>
                            setDraft((cur) => ({ ...cur, designs: cur.designs.filter((x) => x.id !== d.id) }))
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {supply === "us" && (
                <div className="grid gap-3 rounded-md border border-border p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Design online
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {chosenProduct
                      ? `Place your artwork on ${chosenProduct.name} — front, back and sleeves — and see the exact print size.`
                      : "Choose a blank above to open it in the design studio."}
                  </p>
                  {chosenProduct?.slug ? (
                    <Button asChild className="w-fit gap-2">
                      <Link to="/design-studio/$slug" params={{ slug: chosenProduct.slug }} search={{ from: "bulk" }}>
                        <PenTool className="size-4" /> Design this blank
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-fit gap-2" disabled>
                      <PenTool className="size-4" /> Design this blank
                    </Button>
                  )}
                </div>
              )}

              <div className="grid gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Or send us your files
                </p>
                <Button type="button" variant="outline" className="w-fit gap-2" onClick={() => inputRef.current?.click()}>
                  <Upload className="size-4" /> Add a design
                </Button>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void addFiles(e.dataTransfer.files);
                  }}
                  className="grid place-items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-6 py-12 text-center"
                >
                  <ImagePlus className="size-7 text-muted-foreground" />
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Upload your logo or artwork
                  </p>
                  <p className="text-sm text-muted-foreground">PNG, JPG, WEBP or SVG</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    void addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                {art.length > 0 && (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {art.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 rounded-md border border-border p-2">
                        <img src={a.url} alt={a.name} className="size-12 rounded bg-muted object-contain" />
                        <span className="min-w-0 flex-1 truncate text-sm">{a.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${a.name}`}
                          onClick={() =>
                            setDraft((cur) => ({ ...cur, art: cur.art.filter((x) => x.id !== a.id) }))
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </StepBlock>
        </div>
      )}

      {supply && (
        <StepBlock
          index={infoStep}
          eyebrow="Project information"
          title="Details and contact information."
          copyId="bulk.stepInfo"
        >
          <form
            className="grid max-w-3xl gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (sending) return;
              setSending(true);
              try {
                const quantity = Number(fields.quantity) || 0;
                const items = designs
                  .filter((d) => d.snapshot)
                  .map((d) => ({
                    description: `${d.name} — ${d.colorName} · ${d.views}`,
                    quantity: quantity || 1,
                    snapshot: {
                      ...(d.snapshot as DesignSnapshot),
                      decorationMethod: method,
                      quantity: quantity || 1,
                    },
                  }));
                const result = await submitRequest({
                  data: {
                    requestType: "bulk",
                    decorationMethod: method,
                    contactName: fields.name,
                    contactEmail: fields.email,
                    contactPhone: fields.phone,
                    notes: [
                      supply === "us"
                        ? `Straight Line supplies: ${chosenProduct?.name ?? "selected blank"}`
                        : "Customer supplies garments",
                      `Requested quantity: ${fields.quantity || "not specified"}`,
                      fields.details,
                    ]
                      .filter(Boolean)
                      .join("\n"),
                    files: art.map((a) => ({ name: a.name, dataUrl: a.url })),
                    items,
                  },
                });
                setSentNumber(result.quoteNumber);
                setDraft(EMPTY_BULK_DRAFT);
                toast.success(`Request ${result.quoteNumber} sent`, {
                  description: "Keep this number to check the status any time.",
                });
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setSending(false);
              }
            }}
          >
            {supply === "us" && !selectedProduct && (
              <p className="border-l-2 border-primary pl-3 text-sm font-semibold text-muted-foreground">
                Choose a garment from the catalogue above before submitting.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="bulk-name">Your name</Label>
                <Input
                  id="bulk-name"
                  required
                  placeholder="Your name"
                  value={fields.name}
                  onChange={(e) => patch({ fields: { ...fields, name: e.target.value } })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulk-email">Email</Label>
                <Input
                  id="bulk-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={fields.email}
                  onChange={(e) => patch({ fields: { ...fields, email: e.target.value } })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulk-phone">Phone</Label>
                <Input
                  id="bulk-phone"
                  placeholder="Optional"
                  value={fields.phone}
                  onChange={(e) => patch({ fields: { ...fields, phone: e.target.value } })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulk-quantity">Estimated quantity</Label>
                <Input
                  id="bulk-quantity"
                  type="number"
                  min={chosen.min}
                  required
                  placeholder={`Minimum ${chosen.min}`}
                  value={fields.quantity}
                  onChange={(e) => patch({ fields: { ...fields, quantity: e.target.value } })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-details">
                {supply === "you" ? "Garments, colours and size breakdown" : "Colours, sizes and project details"}
              </Label>
              <Textarea
                id="bulk-details"
                rows={5}
                required
                value={fields.details}
                onChange={(e) => patch({ fields: { ...fields, details: e.target.value } })}
                placeholder={
                  supply === "you"
                    ? "Describe the garments you will provide, including material, colours, sizes and quantities."
                    : "List the colours, sizes, quantities, print locations and deadline."
                }
              />
            </div>
            <div className="rounded-md bg-ink p-5 text-ink-foreground">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Your setup</p>
              <p className="display-heading mt-2 text-2xl">
                {chosen.name} · minimum {chosen.min} pieces
              </p>
              <p className="mt-2 text-sm opacity-75">
                {supply === "us"
                  ? `Straight Line supplies ${chosenProduct?.name ?? "the selected blank"}.`
                  : "You supply the garments."}{" "}
                {designs.length
                  ? `${designs.length} studio design${designs.length === 1 ? "" : "s"} saved.`
                  : ""}{" "}
                {art.length
                  ? `${art.length} design file${art.length === 1 ? "" : "s"} ready.`
                  : "Artwork can be added above."}
              </p>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-fit"
              disabled={sending || (supply === "us" && !selectedProduct)}
            >
              {sending ? "Sending…" : "Request a quote"}
            </Button>
            {sentNumber && (
              <p className="border-l-2 border-primary pl-3 text-sm font-semibold">
                Request {sentNumber} received. We review your artwork and come back with pricing.
              </p>
            )}
          </form>
        </StepBlock>
      )}

      <StepBlock index="Already sent" eyebrow="Order status" title="Track an existing request." copyId="bulk.stepStatus">
        <form
          className="grid max-w-xl gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const found = await lookupRequest({ data: { number: ref.trim(), email: email.trim() } });
              setStatusResult(
                found
                  ? `${found.number}: ${found.status.replace(/_/g, " ")} · ${found.items} item(s)`
                  : "No request found for that number and email.",
              );
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          <p className="text-sm text-muted-foreground">
            Enter your request number and the email you used. We show only the status and the number
            of items on the request.
          </p>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="SLP-2026-XXXXXXXX" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
          />
          <Button type="submit" className="w-full sm:w-fit">
            See the status
          </Button>
          {statusResult && <p className="text-sm font-semibold">{statusResult}</p>}
        </form>
      </StepBlock>
    </div>
  );
}

function SupplyCard({
  active,
  onClick,
  eyebrow,
  title,
  body,
  action,
  copyId,
}: {
  active: boolean;
  onClick: () => void;
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  copyId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border p-5 text-left transition",
        active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
      )}
    >
      <Copy as="p" id={`${copyId}.eyebrow`} className="block text-xs font-bold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </Copy>
      <Copy as="h3" id={`${copyId}.title`} className="display-heading mt-2 block text-2xl">
        {title}
      </Copy>
      <Copy as="p" id={`${copyId}.body`} className="mt-2 block text-sm font-semibold text-muted-foreground">
        {body}
      </Copy>
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">{action}</p>
    </button>
  );
}
