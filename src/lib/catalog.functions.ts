import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listPublishedProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, brand, garment_type, description, base_price, category_id, product_colors(id, name, hex, sort_order), garment_assets(id, color_id, view, storage_path)",
    )
    .eq("status", "published")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: product, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, brand, sku, garment_type, gender, fabric, fit, weight, description, base_price, category_id, source_url, product_colors(id, name, hex, sort_order, is_active), product_sizes(id, label, sort_order, price_adjustment, is_active), garment_assets(id, color_id, view, storage_path, image_width, image_height), print_areas(id, name, view, x_pct, y_pct, width_pct, height_pct, physical_width_in, physical_height_in, is_active), product_variants(id, color_id, size_id, price, is_active), calibrations(id, view, reference_type, reference_label, reference_x_pct, reference_y_pct, pixels_per_inch, confirmed)",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return product;
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, name, slug, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});
