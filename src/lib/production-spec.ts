/**
 * Shared, client-safe production specification model.
 *
 * A DesignSnapshot is the frozen record of exactly what a customer configured.
 * It travels from the Design Studio -> cart / request -> order item -> production job
 * and is never re-derived from the (mutable) catalogue afterwards.
 */

export type GarmentViewKey = "front" | "back" | "left_sleeve" | "right_sleeve";

export const VIEW_LABELS: Record<GarmentViewKey, string> = {
  front: "Front",
  back: "Back",
  left_sleeve: "Left sleeve",
  right_sleeve: "Right sleeve",
};

export const DEFAULT_REFERENCE: Record<GarmentViewKey, string> = {
  front: "collar",
  back: "neckline",
  left_sleeve: "sleeve_top",
  right_sleeve: "sleeve_top",
};

export const REFERENCE_LABELS: Record<string, string> = {
  collar: "Collar",
  neckline: "Neckline",
  sleeve_top: "Sleeve top",
  sleeve_seam: "Sleeve seam",
  cuff: "Cuff",
  custom: "Custom landmark",
};

export type SnapshotLayer = {
  id: string;
  kind: "image" | "text" | "shape";
  text?: string;
  color?: string;
  /** artwork file name as uploaded by the customer */
  artworkName?: string;
  /** storage path in the private artwork bucket once persisted */
  artworkPath?: string;
  /** transient preview (data URL) used before persistence */
  artworkPreview?: string;
  /** position/size as a percentage of the print area box */
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  rotation: number;
  /** physical production numbers, inches */
  widthIn: number | null;
  heightIn: number | null;
  fromLeftIn: number | null;
  fromTopIn: number | null;
  /** distance from the calibrated reference point (collar, sleeve top, ...) */
  offsetFromReferenceIn: number | null;
};

export type SnapshotPlacement = {
  view: GarmentViewKey;
  printAreaId: string | null;
  printAreaName: string | null;
  areaXPct: number | null;
  areaYPct: number | null;
  areaWidthPct: number | null;
  areaHeightPct: number | null;
  areaWidthIn: number | null;
  areaHeightIn: number | null;
  referenceType: string;
  referenceLabel: string | null;
  referenceConfirmed: boolean;
  pixelsPerInch: number | null;
  /** garment asset actually used for the approved mockup of this view */
  garmentAssetId: string | null;
  garmentAssetPath: string | null;
  mockupUrl: string | null;
  layers: SnapshotLayer[];
};

export type DesignSnapshot = {
  version: 1;
  capturedAt: string;
  productId: string;
  productName: string;
  productSlug: string;
  brand: string | null;
  sku: string | null;
  colorId: string | null;
  colorName: string | null;
  colorHex: string | null;
  sizeId: string | null;
  sizeLabel: string | null;
  variantId: string | null;
  decorationMethod: string;
  quantity: number;
  quantityMatrix: Record<string, number>;
  unitPrice: number | null;
  notes: string | null;
  placements: SnapshotPlacement[];
};

/* ------------------------------------------------------------------ */
/* Measurements                                                        */
/* ------------------------------------------------------------------ */

export function inchesFromPct(pct: number, totalInches: number | null | undefined) {
  if (!totalInches) return null;
  return Number(((pct / 100) * totalInches).toFixed(2));
}

/**
 * Distance in inches between the calibrated reference point of a view and the
 * top edge of a layer, using the image-space calibration (pixels per inch).
 */
export function offsetFromReference(opts: {
  referenceYPct: number | null | undefined;
  areaYPct: number | null | undefined;
  areaHeightPct: number | null | undefined;
  layerYPct: number;
  imageHeightPx: number | null | undefined;
  pixelsPerInch: number | null | undefined;
}) {
  const { referenceYPct, areaYPct, areaHeightPct, layerYPct, imageHeightPx, pixelsPerInch } = opts;
  if (
    referenceYPct == null ||
    areaYPct == null ||
    areaHeightPct == null ||
    !imageHeightPx ||
    !pixelsPerInch
  ) {
    return null;
  }
  const layerTopPctOfImage = areaYPct + (layerYPct / 100) * areaHeightPct;
  const deltaPx = ((layerTopPctOfImage - referenceYPct) / 100) * imageHeightPx;
  return Number((deltaPx / pixelsPerInch).toFixed(2));
}

export function formatIn(value: number | null | undefined) {
  return value == null ? "—" : `${Number(value).toFixed(2)} in`;
}

/** Human sentence used on the production page and the spec sheet. */
export function placementSentence(p: SnapshotPlacement, layer: SnapshotLayer) {
  const ref = REFERENCE_LABELS[p.referenceType] ?? p.referenceLabel ?? "reference";
  const parts = [
    VIEW_LABELS[p.view],
    `width ${formatIn(layer.widthIn)}`,
    `height ${formatIn(layer.heightIn)}`,
    layer.offsetFromReferenceIn != null
      ? `top from ${ref.toLowerCase()} ${formatIn(layer.offsetFromReferenceIn)}`
      : `from top of print area ${formatIn(layer.fromTopIn)}`,
    `from left ${formatIn(layer.fromLeftIn)}`,
  ];
  if (layer.rotation) parts.push(`rotated ${layer.rotation}°`);
  return parts.join(", ");
}

/* ------------------------------------------------------------------ */
/* Statuses                                                            */
/* ------------------------------------------------------------------ */

export const REQUEST_STATUSES = [
  "new",
  "reviewing",
  "waiting_customer",
  "artwork_required",
  "quote_in_progress",
  "quote_sent",
  "awaiting_approval",
  "approved",
  "paid",
  "proof_required",
  "proof_sent",
  "proof_approved",
  "ready_for_production",
  "in_production",
  "quality_control",
  "ready_for_pickup",
  "shipped",
  "completed",
  "cancelled",
  "declined",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_TYPES = [
  "pod",
  "bulk",
  "quote",
  "screen",
  "dtf",
  "dtf_transfer",
  "embroidery",
  "custom",
] as const;

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  pod: "Print on demand",
  bulk: "Bulk order",
  quote: "Quote request",
  screen: "Screen printing",
  dtf: "DTF garment print",
  dtf_transfer: "DTF transfer / sheet",
  embroidery: "Embroidery",
  custom: "Custom project",
  order: "Order",
};

export const PRIORITIES = ["low", "normal", "high", "rush"] as const;

export const PRODUCTION_STAGES = [
  "new",
  "artwork_review",
  "awaiting_proof",
  "proof_approved",
  "pre_production",
  "in_production",
  "quality_control",
  "ready",
  "shipped",
  "completed",
] as const;

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/* Production readiness                                                */
/* ------------------------------------------------------------------ */

export type ReadinessCheck = { key: string; label: string; ok: boolean; detail?: string };

export function validateReadiness(input: {
  snapshot: Partial<DesignSnapshot> | null | undefined;
  decorationMethod: string | null | undefined;
  proofApproved: boolean;
  paymentOrQuoteApproved: boolean;
  productionFilesApproved: boolean;
  requiresProductionFile: boolean;
}): ReadinessCheck[] {
  const s = input.snapshot ?? null;
  const placements = s?.placements ?? [];
  const method = input.decorationMethod ?? s?.decorationMethod ?? null;
  const isSheet = method === "dtf_transfer";

  const checks: ReadinessCheck[] = [
    { key: "product", label: "Garment product recorded", ok: Boolean(s?.productId) },
    {
      key: "colour",
      label: "Garment colour recorded",
      ok: isSheet ? true : Boolean(s?.colorId || s?.colorName),
    },
    {
      key: "size",
      label: "Size / quantity breakdown recorded",
      ok: Boolean(s?.quantity && s.quantity > 0),
      detail: s?.quantity ? `${s.quantity} pieces` : "No quantity on the job",
    },
    {
      key: "placements",
      label: "At least one placement",
      ok: placements.length > 0,
    },
    {
      key: "artwork",
      label: "Artwork present on every placement",
      ok:
        placements.length > 0 &&
        placements.every((p) => p.layers.length > 0),
      detail: placements
        .filter((p) => p.layers.length === 0)
        .map((p) => `${VIEW_LABELS[p.view]} has no artwork`)
        .join(", "),
    },
    {
      key: "assets",
      label: "Garment image captured for every decorated view",
      ok: isSheet || placements.every((p) => Boolean(p.garmentAssetPath || p.mockupUrl)),
      detail: placements
        .filter((p) => !p.garmentAssetPath && !p.mockupUrl)
        .map((p) => `${VIEW_LABELS[p.view]} mockup missing`)
        .join(", "),
    },
    {
      key: "print_area",
      label: "Print area recorded for every placement",
      ok: isSheet || placements.every((p) => Boolean(p.printAreaId)),
      detail: placements
        .filter((p) => !p.printAreaId)
        .map((p) => `${VIEW_LABELS[p.view]} print area missing`)
        .join(", "),
    },
    {
      key: "dimensions",
      label: "Physical print dimensions available",
      ok:
        placements.length > 0 &&
        placements.every((p) => p.layers.every((l) => l.widthIn != null && l.heightIn != null)),
    },
    {
      key: "calibration",
      label: "Calibration reference confirmed for every placement",
      ok: isSheet || placements.every((p) => p.referenceConfirmed),
      detail: placements
        .filter((p) => !p.referenceConfirmed)
        .map((p) => `${VIEW_LABELS[p.view]} not calibrated`)
        .join(", "),
    },
    { key: "method", label: "Decoration method set", ok: Boolean(method) },
    { key: "proof", label: "Customer proof approved", ok: input.proofApproved },
    {
      key: "commercial",
      label: "Payment or quote approval recorded",
      ok: input.paymentOrQuoteApproved,
    },
  ];

  if (input.requiresProductionFile) {
    checks.push({
      key: "production_file",
      label: "Approved production file uploaded",
      ok: input.productionFilesApproved,
      detail: input.productionFilesApproved ? "" : "Digitised / print-ready file missing",
    });
  }

  return checks;
}

export function isReady(checks: ReadinessCheck[]) {
  return checks.every((c) => c.ok);
}

/* ------------------------------------------------------------------ */
/* Numbering                                                           */
/* ------------------------------------------------------------------ */

export function makeNumber(prefix: "REQ" | "ORD" | "JOB") {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SLP-${prefix}-${year}-${rand}`;
}
