import { useEffect, useState } from "react";
import { garmentImageUrl } from "@/lib/garment";
import { signedArtworkUrl } from "@/lib/storage";
import {
  REFERENCE_LABELS,
  VIEW_LABELS,
  formatIn,
  placementSentence,
  titleCase,
  type DesignSnapshot,
  type SnapshotLayer,
  type SnapshotPlacement,
} from "@/lib/production-spec";

/**
 * Renders one frozen customer design exactly as it must be produced.
 * Every configured placement (Front, Back, Left sleeve, Right sleeve, …) gets
 * its own panel. Nothing is substituted: a missing garment photo or print area
 * is named as missing rather than replaced with another asset.
 */
export function DesignSpec({
  snapshot,
  overrides,
}: {
  snapshot: DesignSnapshot & { quantity?: number };
  overrides?: Record<string, { value: string; original: string | null; reason: string | null }>;
}) {
  const placements = snapshot.placements ?? [];
  return (
    <div className="border border-border bg-card">
      <div className="grid gap-1 border-b border-border bg-secondary p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="display-heading text-xl">{snapshot.productName}</p>
          <p className="text-sm font-bold uppercase tracking-widest">
            {snapshot.quantity ?? 0} units
          </p>
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {snapshot.brand ? `${snapshot.brand} · ` : ""}
          {snapshot.sku ? `SKU ${snapshot.sku} · ` : ""}
          {snapshot.colorName ?? "—"} · {snapshot.sizeLabel ?? "—"} ·{" "}
          {titleCase(snapshot.decorationMethod ?? "—")}
        </p>
        <p className="text-xs text-muted-foreground">
          Placements: {placements.length ? placements.map((p) => VIEW_LABELS[p.view]).join(" · ") : "none"}
        </p>
      </div>

      {Object.keys(snapshot.quantityMatrix ?? {}).length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border p-4 text-xs">
          {Object.entries(snapshot.quantityMatrix).map(([size, qty]) => (
            <span key={size} className="border border-border px-2 py-1 font-bold uppercase">
              {size}: {qty}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-6 p-4">
        {placements.map((p) => (
          <PlacementBlock key={p.view} placement={p} overrides={overrides ?? {}} />
        ))}
        {placements.length === 0 && (
          <p className="text-sm text-muted-foreground">No placements recorded on this item.</p>
        )}
      </div>
    </div>
  );
}

function PlacementBlock({
  placement: p,
  overrides,
}: {
  placement: SnapshotPlacement;
  overrides?: Record<string, { value: string; original: string | null; reason: string | null }>;
}) {
  const mockup = p.mockupUrl ?? garmentImageUrl(p.garmentAssetPath);
  const missing: string[] = [];
  if (!mockup) missing.push(`garment photo for ${VIEW_LABELS[p.view]} in this colour`);
  if (p.areaXPct == null || !p.printAreaId) missing.push("print area");
  if (!p.areaWidthIn || !p.areaHeightIn) missing.push("physical print-area size");
  if (!p.referenceConfirmed) missing.push("confirmed calibration reference");

  return (
    <div className="border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary px-4 py-2">
        <p className="text-xs font-bold uppercase tracking-widest">{VIEW_LABELS[p.view]}</p>
        <p className="text-xs text-muted-foreground">
          {p.layers.length} artwork {p.layers.length === 1 ? "item" : "items"}
        </p>
      </div>

      {missing.length > 0 && (
        <p className="border-b border-border bg-primary/5 px-4 py-2 text-xs font-semibold text-primary">
          Missing for production: {missing.join(", ")}
        </p>
      )}

      <div className="grid gap-4 p-4 md:grid-cols-[16rem_1fr]">
        <div>
          <div className="relative aspect-square border border-border bg-secondary">
            {mockup ? (
              <>
                <img
                  src={mockup}
                  alt={`${VIEW_LABELS[p.view]} mockup`}
                  className="absolute inset-0 size-full object-contain"
                />
                {p.areaXPct != null && (
                  <div
                    className="absolute border border-dashed border-primary"
                    style={{
                      left: `${p.areaXPct}%`,
                      top: `${p.areaYPct}%`,
                      width: `${p.areaWidthPct}%`,
                      height: `${p.areaHeightPct}%`,
                    }}
                  >
                    {p.layers.map((l) => (
                      <div
                        key={l.id}
                        className="absolute"
                        style={{
                          left: `${l.xPct}%`,
                          top: `${l.yPct}%`,
                          width: `${l.wPct}%`,
                          height: `${l.hPct}%`,
                        }}
                      >
                        <RotatedArtworkThumb layer={l} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="flex size-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
                No garment photo captured for this view and colour
              </p>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
            Mockup — visual reference only, not a production file
          </p>
        </div>

        <div className="text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Production placement
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
            <Row label="Print area" value={`${p.printAreaName ?? "—"}`} />
            <Row
              label="Print area size"
              value={p.areaWidthIn ? `${formatIn(p.areaWidthIn)} × ${formatIn(p.areaHeightIn)}` : "—"}
            />
            <Row
              label="Reference point"
              value={`${REFERENCE_LABELS[p.referenceType] ?? p.referenceType}${
                p.referenceLabel ? ` (${p.referenceLabel})` : ""
              }${p.referenceConfirmed ? "" : " — not confirmed"}`}
            />
            <Row
              label="Calibration"
              value={p.pixelsPerInch ? `${Number(p.pixelsPerInch).toFixed(1)} px / in` : "—"}
            />
          </dl>

          <div className="mt-4 grid gap-3">
            {p.layers.map((l) => {
              const key = `${p.view}:${l.id}`;
              const ov = overrides?.[key];
              return (
                <div key={l.id} className="border-l-2 border-primary bg-secondary/50 p-3">
                  <p className="font-semibold">
                    {l.kind === "image" ? (l.artworkName ?? "Artwork") : `${titleCase(l.kind)} layer`}
                  </p>
                  <p className="mt-1">{placementSentence(p, l)}</p>
                  {l.kind === "text" && <p className="mt-1 italic">“{l.text}”</p>}
                  {l.color && l.kind !== "image" && (
                    <p className="mt-1 text-xs text-muted-foreground">Colour {l.color}</p>
                  )}
                  {ov ? (
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">
                      Manual override: {ov.value}
                      {ov.original ? ` (calculated ${ov.original})` : ""}
                      {ov.reason ? ` — ${ov.reason}` : ""}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                      Calculated from calibration
                    </p>
                  )}
                  <ArtworkActions layer={l} />
                </div>
              );
            })}
            {p.layers.length === 0 && (
              <p className="text-muted-foreground">No artwork on this placement.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </>
  );
}

function useArtworkUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!path) return;
    void signedArtworkUrl(path).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [path]);
  return url;
}

function ArtworkThumb({ layer }: { layer: SnapshotLayer }) {
  const signed = useArtworkUrl(layer.artworkPath);
  const src = signed ?? layer.artworkPreview ?? null;
  if (layer.kind === "image") {
    return src ? (
      <img src={src} alt="" className="size-full object-contain" />
    ) : (
      <span className="block size-full border border-dashed border-primary/60" />
    );
  }
  if (layer.kind === "text") {
    return (
      <span
        className="flex size-full items-center justify-center text-center text-[10px] font-bold leading-none"
        style={{ color: layer.color }}
      >
        {layer.text}
      </span>
    );
  }
  return <span className="block size-full" style={{ backgroundColor: layer.color }} />;
}

function RotatedArtworkThumb({ layer }: { layer: SnapshotLayer }) {
  const sideways = layer.rotation % 180 !== 0;
  return (
    <div
      className={sideways ? "absolute" : "size-full"}
      style={
        sideways
          ? {
              left: "50%",
              top: "50%",
              width: `${(layer.hPct / layer.wPct) * 100}%`,
              height: `${(layer.wPct / layer.hPct) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
            }
          : { transform: `rotate(${layer.rotation}deg)` }
      }
    >
      <ArtworkThumb layer={layer} />
    </div>
  );
}

function ArtworkActions({ layer }: { layer: SnapshotLayer }) {
  const signed = useArtworkUrl(layer.artworkPath);
  if (signed) {
    return (
      <a
        href={signed}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs font-bold uppercase tracking-widest text-primary hover:underline"
      >
        Download original artwork file
      </a>
    );
  }
  if (layer.artworkPreview) {
    return (
      <a
        href={layer.artworkPreview}
        download={layer.artworkName ?? "design-preview.png"}
        className="mt-2 inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground hover:underline"
      >
        Download studio preview (not production ready)
      </a>
    );
  }
  if (layer.kind === "image") {
    return (
      <p className="mt-2 text-xs font-semibold text-primary">
        Original artwork file missing — request it from the customer
      </p>
    );
  }
  return null;
}
