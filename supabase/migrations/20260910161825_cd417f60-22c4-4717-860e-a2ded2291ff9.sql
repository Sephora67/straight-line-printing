ALTER TABLE public.products ADD COLUMN IF NOT EXISTS source_url text;

INSERT INTO public.suppliers (id, name, website, is_active)
VALUES ('7f3b1a10-0000-4000-8000-000000000001', 'Canada Sportswear', 'https://canadasportswear.com', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, slug, brand, manufacturer, sku, garment_type, description, base_price, supplier_id, supplier_sku, source_url, status)
VALUES
 ('a1000000-0000-4000-8000-000000000001','Parkour Men Crew Neck Tee','parkour-men-crew-neck-tee','Canada Sportswear','Canada Sportswear','S05610','t-shirt','Men''s crew neck cotton tee.',12.00,'7f3b1a10-0000-4000-8000-000000000001','S05610','https://canadasportswear.com/collections/25-cotton-t-shirts/products/s05610-parkour-men-crew-neck-tee','draft'),
 ('a1000000-0000-4000-8000-000000000002','Parkour Youth Crew Neck Tee','parkour-youth-crew-neck-tee','Canada Sportswear','Canada Sportswear','S5610Y','t-shirt','Youth crew neck cotton tee.',11.00,'7f3b1a10-0000-4000-8000-000000000001','S5610Y','https://canadasportswear.com/collections/25-cotton-t-shirts/products/s5610y-parkour-youth-crew-neck-tee','draft'),
 ('a1000000-0000-4000-8000-000000000003','Parkour Ladies Crew Neck Tee','parkour-ladies-crew-neck-tee','Canada Sportswear','Canada Sportswear','S05611','t-shirt','Ladies crew neck cotton tee.',12.00,'7f3b1a10-0000-4000-8000-000000000001','S05611','https://canadasportswear.com/collections/25-cotton-t-shirts/products/s05611-parkour-ladies-crew-neck-tee','draft'),
 ('a1000000-0000-4000-8000-000000000004','Vault Adult Pullover Hooded Sweatshirt','vault-adult-pullover-hooded-sweatshirt','Canada Sportswear','Canada Sportswear','10550','hoodie','Adult pullover hooded sweatshirt.',34.00,'7f3b1a10-0000-4000-8000-000000000001','10550','https://canadasportswear.com/collections/brands/products/10550-vault-adult-pullover-hooded-sweatshirt','draft'),
 ('a1000000-0000-4000-8000-000000000005','Vanguard Tricot Hi-Vis 5-Point Tear-Away Vest','vanguard-tricot-hi-vis-tear-away-vest','Canada Sportswear','Canada Sportswear','101145','safety-vest','Hi-vis 5-point tear-away safety vest, dual sized.',26.00,'7f3b1a10-0000-4000-8000-000000000001','101145','https://canadasportswear.com/collections/25-hi-vis-safety-vests/products/101145-vanguard-tricot-hi-vis-5-point-tear-away-vest-dual-sized','draft'),
 ('a1000000-0000-4000-8000-000000000006','Crew Adult Crewneck Pullover Sweatshirt','crew-adult-crewneck-pullover-sweatshirt','Canada Sportswear','Canada Sportswear','100540','crewneck','Adult crewneck pullover sweatshirt.',30.00,'7f3b1a10-0000-4000-8000-000000000001','100540','https://canadasportswear.com/collections/25-crewneck/products/100540-crew-adult-crewnec-pullover-sweatshirt','draft'),
 ('a1000000-0000-4000-8000-000000000007','Crew Youth Crewneck Pullover','crew-youth-crewneck-pullover','Canada Sportswear','Canada Sportswear','10540Y','crewneck','Youth crewneck pullover sweatshirt.',27.00,'7f3b1a10-0000-4000-8000-000000000001','10540Y','https://canadasportswear.com/collections/25-crewneck/products/10540y-crew-youth-crewneck-pullover','draft'),
 ('a1000000-0000-4000-8000-000000000008','Breeze Men''s Long Sleeve Crew Neck Tee','breeze-mens-long-sleeve-crew-neck-tee','Canada Sportswear','Canada Sportswear','S05615','long-sleeve-tee','Men''s long sleeve crew neck tee.',16.00,'7f3b1a10-0000-4000-8000-000000000001','S05615','https://canadasportswear.com/collections/25-long-sleeve/products/s05615-breeze-mens-long-sleeve-crew-neck-tee','draft'),
 ('a1000000-0000-4000-8000-000000000009','Breeze Ladies Long Sleeve Crew Neck Tee','breeze-ladies-long-sleeve-crew-neck-tee','Canada Sportswear','Canada Sportswear','S05616','long-sleeve-tee','Ladies long sleeve crew neck tee.',16.00,'7f3b1a10-0000-4000-8000-000000000001','S05616','https://canadasportswear.com/collections/25-long-sleeve/products/s05616-breeze-ladies-long-sleeve-crew-neck-tee','draft')
ON CONFLICT (id) DO NOTHING;

-- print areas derived from the marked-up garment photos
WITH tee AS (
  SELECT unnest(ARRAY['a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000003']::uuid[]) AS pid
), tee_rows AS (
  SELECT pid, v.view, v.name, v.x, v.y, v.w, v.h, v.pw, v.ph
  FROM tee, (VALUES
    ('front'::garment_view,'Front',33,25,32,57,12,16),
    ('back'::garment_view,'Back',37,26,28,60,12,16),
    ('left_sleeve'::garment_view,'Left Sleeve',40,30,20,12,3.5,3.5),
    ('right_sleeve'::garment_view,'Right Sleeve',40,30,20,12,3.5,3.5)
  ) AS v(view,name,x,y,w,h,pw,ph)
)
INSERT INTO public.print_areas (product_id, view, name, x_pct, y_pct, width_pct, height_pct, physical_width_in, physical_height_in)
SELECT pid, view, name, x, y, w, h, pw, ph FROM tee_rows;

INSERT INTO public.print_areas (product_id, view, name, x_pct, y_pct, width_pct, height_pct, physical_width_in, physical_height_in)
VALUES
 ('a1000000-0000-4000-8000-000000000004','front','Front',33,29,45,32,12,9),
 ('a1000000-0000-4000-8000-000000000004','back','Back',31,26,36,55,12,15),
 ('a1000000-0000-4000-8000-000000000004','left_sleeve','Left Sleeve',38,15,24,70,3.5,14),
 ('a1000000-0000-4000-8000-000000000004','right_sleeve','Right Sleeve',38,15,24,70,3.5,14),
 ('a1000000-0000-4000-8000-000000000005','front','Front (lower panels)',10,75,35,16,5,3),
 ('a1000000-0000-4000-8000-000000000005','back','Back banner',17,79,66,16,11,3);

WITH crew AS (
  SELECT unnest(ARRAY['a1000000-0000-4000-8000-000000000006','a1000000-0000-4000-8000-000000000007','a1000000-0000-4000-8000-000000000008','a1000000-0000-4000-8000-000000000009']::uuid[]) AS pid
), crew_rows AS (
  SELECT pid, v.view, v.name, v.x, v.y, v.w, v.h, v.pw, v.ph
  FROM crew, (VALUES
    ('front'::garment_view,'Front',33,25,32,57,12,16),
    ('back'::garment_view,'Back',37,26,28,60,12,16),
    ('left_sleeve'::garment_view,'Left Sleeve',38,15,24,70,3.5,14),
    ('right_sleeve'::garment_view,'Right Sleeve',38,15,24,70,3.5,14)
  ) AS v(view,name,x,y,w,h,pw,ph)
)
INSERT INTO public.print_areas (product_id, view, name, x_pct, y_pct, width_pct, height_pct, physical_width_in, physical_height_in)
SELECT pid, view, name, x, y, w, h, pw, ph FROM crew_rows;