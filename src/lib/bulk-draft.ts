import type { DesignSnapshot } from "@/lib/production-spec";

export type BulkArtwork = { id: string; name: string; url: string };

export type BulkDesign = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  colorName: string;
  sizeLabel: string;
  views: string;
  image: string | null;
  /** frozen production configuration captured in the Design Studio */
  snapshot?: DesignSnapshot;
};

export type BulkDraft = {
  method: string;
  supply: "us" | "you" | null;
  productId: string | null;
  art: BulkArtwork[];
  designs: BulkDesign[];
  fields: {
    name: string;
    email: string;
    phone: string;
    quantity: string;
    details: string;
  };
};

export const EMPTY_BULK_DRAFT: BulkDraft = {
  method: "dtf",
  supply: null,
  productId: null,
  art: [],
  designs: [],
  fields: { name: "", email: "", phone: "", quantity: "", details: "" },
};

const KEY = "slp-bulk-draft-v1";

export function readBulkDraft(): BulkDraft {
  if (typeof window === "undefined") return EMPTY_BULK_DRAFT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_BULK_DRAFT;
    const parsed = JSON.parse(raw) as Partial<BulkDraft>;
    return {
      ...EMPTY_BULK_DRAFT,
      ...parsed,
      art: parsed.art ?? [],
      designs: parsed.designs ?? [],
      fields: { ...EMPTY_BULK_DRAFT.fields, ...(parsed.fields ?? {}) },
    };
  } catch {
    return EMPTY_BULK_DRAFT;
  }
}

export function writeBulkDraft(draft: BulkDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* quota — ignore */
  }
}

export function addBulkDesign(design: Omit<BulkDesign, "id">) {
  const draft = readBulkDraft();
  writeBulkDraft({
    ...draft,
    productId: design.productId,
    supply: draft.supply ?? "us",
    designs: [...draft.designs, { ...design, id: crypto.randomUUID() }],
  });
}

export function clearBulkDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
