-- 1) Hide internal business columns on products from anonymous visitors
REVOKE SELECT (wholesale_cost, supplier_sku) ON public.products FROM anon;

-- 2) Hide internal business columns on product_variants from anonymous visitors
REVOKE SELECT (wholesale_cost, supplier_sku, sku, quantity_available, quantity_reserved, quantity_sold, low_stock_threshold) ON public.product_variants FROM anon;

-- 3) Tighten helper functions: authenticated users only, never anonymous
REVOKE EXECUTE ON FUNCTION public.claim_owner_if_unclaimed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_owner_if_unclaimed() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.current_user_roles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO authenticated;