-- ===========================================================================
-- Kickd — seed data (3 categories, 9 products, UK 6–12 sizes with stock)
-- Run AFTER schema.sql, in the Supabase SQL Editor. Safe to re-run.
-- Image paths point at /public/images/... shipped with the app. Replace them
-- later from the /admin page (uploads go to the product-images storage bucket).
-- ===========================================================================

-- Categories ---------------------------------------------------------------
insert into public.categories (name, slug, description, image_url) values
  ('Sneakers', 'sneakers',
   'Everyday street style. Comfort that goes the distance.',
   '/images/sneakers/img-1.webp'),
  ('Running Shoes', 'running-shoes',
   'Engineered for speed, cushioned for the long run.',
   '/images/running-shoes/img-1.webp'),
  ('Boots', 'boots',
   'Built to last. Rugged looks for any terrain.',
   '/images/boots/img-1.webp')
on conflict (slug) do nothing;

-- Products -----------------------------------------------------------------
insert into public.products (category_id, name, slug, description, price, image_url, is_featured)
select c.id, v.name, v.slug, v.description, v.price, v.image_url, v.is_featured
from (values
  -- Sneakers
  ('sneakers', 'Kickd Aero Low', 'kickd-aero-low',
   'A clean low-top built for daily wear. Breathable mesh upper, plush foam midsole, and a grippy rubber outsole.',
   4999, '/images/sneakers/img-1.webp', true),
  ('sneakers', 'Kickd Street Pro', 'kickd-street-pro',
   'Premium street sneaker with a structured silhouette and cushioned collar for all-day comfort.',
   5999, '/images/sneakers/img-2.webp', false),
  ('sneakers', 'Kickd Cloud Knit', 'kickd-cloud-knit',
   'Sock-like knit construction that hugs your foot. Lightweight, flexible, and impossibly comfy.',
   4499, '/images/sneakers/img-3.webp', true),

  -- Running Shoes
  ('running-shoes', 'Kickd Velocity X', 'kickd-velocity-x',
   'Race-day ready. Responsive energy-return foam and a featherweight upper to keep your pace high.',
   6999, '/images/running-shoes/img-1.webp', true),
  ('running-shoes', 'Kickd Pace Lite', 'kickd-pace-lite',
   'Your everyday trainer. Balanced cushioning and breathable support for tempo runs and easy miles.',
   5499, '/images/running-shoes/img-2.webp', false),
  ('running-shoes', 'Kickd Endure GT', 'kickd-endure-gt',
   'Long-distance comfort with maximal cushioning and a durable outsole that eats up the kilometres.',
   7499, '/images/running-shoes/img-3.webp', false),

  -- Boots
  ('boots', 'Kickd Rugged Trail', 'kickd-rugged-trail',
   'A trail-ready boot with a waterproof upper and aggressive lugs for serious grip off the beaten path.',
   8999, '/images/boots/img-1.webp', true),
  ('boots', 'Kickd Urban Chelsea', 'kickd-urban-chelsea',
   'A sleek Chelsea boot that goes from office to evening. Premium finish, elastic side panels, easy on-off.',
   7999, '/images/boots/img-2.webp', false),
  ('boots', 'Kickd Storm Hiker', 'kickd-storm-hiker',
   'Built for the elements. Insulated, weatherproof, and tough enough for the harshest conditions.',
   9499, '/images/boots/img-3.webp', false)
) as v(cat, name, slug, description, price, image_url, is_featured)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- Sizes (UK 6–12 on every product, with varied stock) ----------------------
insert into public.product_sizes (product_id, size, stock)
select p.id, s.size, s.stock
from public.products p
cross join (values
  ('UK 6', 8), ('UK 7', 12), ('UK 8', 15), ('UK 9', 15),
  ('UK 10', 10), ('UK 11', 6), ('UK 12', 4)
) as s(size, stock)
on conflict (product_id, size) do nothing;

-- Demonstrate an out-of-stock size on one product ---------------------------
update public.product_sizes ps
   set stock = 0
  from public.products p
 where ps.product_id = p.id
   and p.slug = 'kickd-aero-low'
   and ps.size = 'UK 12';
