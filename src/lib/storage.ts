import { supabase } from "@/integrations/supabase/client";

export const GARMENT_BUCKET = "garment-assets";
export const ARTWORK_BUCKET = "artwork";

export async function signedArtworkUrl(path: string | null | undefined, expiresIn = 3600) {
  if (!path) return null;
  const { data } = await supabase.storage.from(ARTWORK_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function signedAssetUrl(path: string | null | undefined, expiresIn = 3600) {
  if (!path) return null;
  const { data } = await supabase.storage.from(GARMENT_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function signedAssetUrls(paths: string[], expiresIn = 3600) {
  if (paths.length === 0) return {} as Record<string, string>;
  const { data } = await supabase.storage
    .from(GARMENT_BUCKET)
    .createSignedUrls(paths, expiresIn);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}
