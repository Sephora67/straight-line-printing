export type GarmentView = "front" | "back" | "left_sleeve" | "right_sleeve";

export const VIEW_ORDER: GarmentView[] = ["front", "back", "left_sleeve", "right_sleeve"];

export const VIEW_LABEL: Record<GarmentView, string> = {
  front: "Front",
  back: "Back",
  left_sleeve: "Left sleeve",
  right_sleeve: "Right sleeve",
};

/** Public URL for a garment photo stored in the private garment bucket. */
export function garmentImageUrl(path: string | null | undefined) {
  if (!path) return null;
  return `/api/public/garment/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function money(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}
