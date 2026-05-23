# Kickd 👟

A clean, modern e-commerce store for shoes — sneakers, running shoes, and boots.
White-and-red minimal design, fully responsive, with real auth, a persistent
cart, Razorpay payments, and an admin product manager.

> **Setting this up for the first time?** Follow [`SETUP.md`](./SETUP.md) — it
> walks through Supabase, Razorpay, Resend, env vars, running locally, and
> deploying to Vercel, step by step.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS (white/red brand tokens) |
| Database / Auth / Storage | Supabase (Postgres + RLS) |
| Payments | Razorpay (server order + HMAC verify) |
| Email | Resend (order confirmations) |
| Cart state | Zustand + localStorage, synced to DB on login |
| Hosting | Vercel |

## Features

- Landing page (hero, categories, featured products)
- Browse all products with category filter + price/newest sorting
- Per-category listings, product detail with UK size selector + per-size stock
- Persistent cart (guest localStorage → merged into the DB cart on sign-in)
- Email/password auth via Supabase, login-gated checkout
- Razorpay checkout: server recomputes totals, verifies the payment signature,
  decrements stock, clears the cart, emails a receipt
- Order confirmation + order history
- Protected `/admin` page: add/edit/delete products, prices, stock, images

## Project structure

```
app/                 Routes (App Router)
  page.tsx           Landing
  products/          All products + filters
  category/[slug]/   Per-category listing
  product/[slug]/    Product detail
  cart/  checkout/   Cart + checkout
  orders/            History + order detail/confirmation
  login/ signup/     Auth
  admin/             Product manager (admin only)
  auth/callback/     Supabase email-confirmation handler
  api/checkout/      Razorpay create-order + verify route handlers
components/          Navbar, Footer, CartDrawer, ProductCard, forms, admin/*
lib/
  supabase/          client / server / admin (service-role) / middleware
  store/cart.ts      Zustand cart
  queries.ts         Server-side data fetching
  razorpay.ts email.ts utils.ts types.ts cart-sync.ts
supabase/
  schema.sql         Tables, indexes, RLS, triggers, functions, storage bucket
  seed.sql           3 categories, 9 products, UK 6–12 stock
public/images/       Seed product images
```

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in values (see SETUP.md)
npm run dev                         # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Security notes

- The cart total is **recomputed from the database** on the server before a
  Razorpay order is created — client-supplied prices are never trusted.
- Payment success is confirmed by verifying Razorpay's **HMAC signature** with
  the secret key; orders are written/updated with the **service-role** key,
  never from the browser.
- Row Level Security is enabled on every table; users can only read their own
  cart/orders, and only admins can write products/categories.
- `.env.local` is gitignored. Never commit secrets.

See [`SETUP.md`](./SETUP.md) for full setup and deployment instructions.
