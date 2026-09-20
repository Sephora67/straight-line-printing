import { useMemo, useRef, useState } from "react";
import { CloudUpload, FileCheck2, Scissors, ShieldCheck, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Copy } from "@/lib/site-copy";

const RATE_PER_SQ_IN = 0.05;
const EXPRESS_FEE = 5;
const SEPARATE_CUT_FEE = 0.25;
const FILE_CHECK_FEE = 2.5;

const money = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);

type Artwork = { id: string; name: string; url: string };

const ADDONS = [
  {
    key: "cleanup" as const,
    icon: ShieldCheck,
    title: "Request background cleanup",
    body: "Our production team reviews and removes an unwanted background. No automatic edit is applied.",
    price: "",
  },
  {
    key: "express" as const,
    icon: Zap,
    title: "Express dispatch",
    body: "Priority production for orders received before noon.",
    price: "+$5.00 / order",
  },
  {
    key: "cuts" as const,
    icon: Scissors,
    title: "Cut each transfer separately",
    body: "Individual cuts for each uploaded file.",
    price: "+$0.25 / file",
  },
  {
    key: "filecheck" as const,
    icon: FileCheck2,
    title: "Professional file check",
    body: "We review sizing, transparency and print readiness before production.",
    price: "+$2.50 / file",
  },
];

export function DtfSheetBuilder() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Artwork[]>([]);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [linked, setLinked] = useState(true);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const ratio = useRef(1);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: Artwork[] = [];
    for (const file of Array.from(list).slice(0, 10 - files.length)) {
      next.push({ id: crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file) });
    }
    if (next.length === 0) {
      toast.error("You can upload up to 10 files per order.");
      return;
    }
    setFiles((f) => [...f, ...next]);
  }

  const totals = useMemo(() => {
    const area = Math.max(width, 0) * Math.max(height, 0);
    const perTransfer = area * RATE_PER_SQ_IN;
    const transfers = files.length * Math.max(quantity, 1);
    const base = perTransfer * transfers;
    const extras =
      (addons["express"] ? EXPRESS_FEE : 0) +
      (addons["cuts"] ? SEPARATE_CUT_FEE * files.length : 0) +
      (addons["filecheck"] ? FILE_CHECK_FEE * files.length : 0);
    return { area, perTransfer, transfers, total: base + extras };
  }, [addons, files.length, height, quantity, width]);

  const ready = files.length > 0;

  return (
    <div className="pb-28">
      <div className="section-shell grid gap-12 py-12 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="grid gap-12">
          <StepBlock index="01" eyebrow="Artwork files" title="Bring the sheet to life."
            copyId="dtf.step01"
            aside={`${files.length} uploaded`}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="grid place-items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 px-6 py-12 text-center"
            >
              <CloudUpload className="size-8 text-primary" />
              <Copy as="p" id="dtf.drop.title" className="font-semibold">
                Drag and drop artwork here
              </Copy>
              <Copy as="p" id="dtf.drop.body" className="text-sm text-muted-foreground">
                or choose up to 10 PNG, JPG, WEBP or SVG files
              </Copy>
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                Choose files
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {files.length > 0 && (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-md border border-border p-2"
                  >
                    <img
                      src={f.url}
                      alt={f.name}
                      className="size-12 rounded bg-muted object-contain"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => setFiles((list) => list.filter((x) => x.id !== f.id))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </StepBlock>

          <StepBlock index="02" eyebrow="Transfer setup" title="Set the print dimensions." copyId="dtf.step02">
            <div className="grid gap-4">
              <NumberField
                label="Width / inches"
                value={width}
                onChange={(v) => {
                  setWidth(v);
                  if (linked && v > 0) setHeight(Number((v / ratio.current).toFixed(2)));
                }}
              />
              <NumberField
                label="Height / inches"
                value={height}
                onChange={(v) => {
                  setHeight(v);
                  if (linked && v > 0) setWidth(Number((v * ratio.current).toFixed(2)));
                }}
              />
              <NumberField
                label="Transfers / quantity"
                value={quantity}
                onChange={(v) => setQuantity(Math.max(1, Math.round(v)))}
              />
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={linked}
                  onCheckedChange={(c) => {
                    const on = c === true;
                    if (on && height > 0) ratio.current = width / height;
                    setLinked(on);
                  }}
                />
                <span>
                  <span className="font-semibold">Keep transfer dimensions linked</span>
                  <span className="block text-muted-foreground">
                    Changing one dimension scales the selected transfer proportions. This does not
                    edit the artwork itself.
                  </span>
                </span>
              </label>
            </div>
          </StepBlock>

          <StepBlock index="03" eyebrow="File handling" title="Choose how we prep it." copyId="dtf.step03">
            <ul className="divide-y divide-border border-y border-border">
              {ADDONS.map((a) => (
                <li key={a.key} className="flex items-start gap-4 py-4">
                  <Checkbox
                    checked={!!addons[a.key]}
                    onCheckedChange={(c) => setAddons((s) => ({ ...s, [a.key]: c === true }))}
                    aria-label={a.title}
                  />
                  <a.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Copy as="p" id={`dtf.addon.${a.key}.title`} className="font-semibold">
                        {a.title}
                      </Copy>
                      {a.price && (
                        <p className="text-sm font-bold text-muted-foreground">{a.price}</p>
                      )}
                    </div>
                    <Copy as="p" id={`dtf.addon.${a.key}.body`} className="text-sm text-muted-foreground">
                      {a.body}
                    </Copy>
                  </div>
                </li>
              ))}
            </ul>
          </StepBlock>
        </div>

        <aside className="grid gap-5 rounded-md bg-ink p-6 text-ink-foreground lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.25em]">DTF transfer estimate</p>
          <p className="display-heading text-4xl">
            {ready ? money(totals.total) : "—"}
          </p>
          {!ready && (
            <p className="text-sm opacity-70">Upload artwork to calculate your estimate</p>
          )}
          <dl className="grid gap-2 border-t border-white/15 pt-4 text-sm">
            <Row label="Artwork files" value={String(files.length)} />
            <Row label="Selected transfer area" value={`${width}" × ${height}"`} />
            <Row
              label="Transfers / quantity"
              value={`${totals.transfers} transfer${totals.transfers === 1 ? "" : "s"}`}
            />
            <Row label="Rate" value={`${money(RATE_PER_SQ_IN)} / sq. in.`} />
          </dl>
          <div className="border-t border-white/15 pt-4 text-sm opacity-75">
            <p className="mb-2 font-bold uppercase tracking-widest opacity-100">Pricing details</p>
            <p>
              The selected dimensions apply to every uploaded file. Each file is priced as one
              full-size transfer for each quantity ordered; files stay together in one order and
              separate cuts are optional.
            </p>
            <p className="mt-2">
              Garment or product not included — bring your own blank. Shipping and tax are confirmed
              before payment.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest">Print area preview</p>
            <div
              className="grid place-items-center rounded border border-white/20 bg-[repeating-conic-gradient(rgba(255,255,255,0.12)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-4"
              style={{ aspectRatio: `${Math.max(width, 1)} / ${Math.max(height, 1)}` }}
            >
              {ready ? (
                <img
                  src={files[0]!.url}
                  alt="First uploaded transfer"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs uppercase tracking-widest opacity-60">
                  Upload artwork first
                </span>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 text-ink-foreground backdrop-blur">
        <div className="section-shell flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-70">
              DTF transfer estimate
            </p>
            <p className="display-heading text-2xl">{ready ? money(totals.total) : "—"}</p>
          </div>
          <Button
            disabled={!ready}
            onClick={() =>
              toast.success("Estimate saved to your request", {
                description: "Send it through the quote form and we'll confirm the final price.",
              })
            }
          >
            {ready ? "Continue" : "Upload artwork first"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="uppercase tracking-widest opacity-70">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block rounded-md border border-border p-4">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <Input
        type="number"
        min={0.5}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-auto border-0 p-0 text-3xl font-semibold shadow-none focus-visible:ring-0"
      />
    </label>
  );
}

export function StepBlock({
  index,
  eyebrow,
  title,
  aside,
  copyId,
  children,
  className,
}: {
  index: string;
  eyebrow: string;
  title: string;
  aside?: string | undefined;
  /** When set, staff can reword the step labels without changing the layout. */
  copyId?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            {index} / {copyId ? <Copy id={`${copyId}.eyebrow`}>{eyebrow}</Copy> : eyebrow}
          </p>
          <h2 className="display-heading mt-2 text-3xl md:text-4xl">
            {copyId ? <Copy id={`${copyId}.title`}>{title}</Copy> : title}
          </h2>
        </div>
        {aside && (
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {aside}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
