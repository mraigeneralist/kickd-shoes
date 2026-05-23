# Kickd — Setup Guide

This is the complete, step-by-step guide to get your Kickd store running locally
and deployed live. Follow it top to bottom. No step is optional unless marked so.

**Stack:** Next.js 14 (App Router) · Supabase (DB + Auth + Storage) · Razorpay
(payments) · Resend (order emails) · Vercel (hosting).

---

## 0. Prerequisites

- **Node.js 18.18+** (you have v22 — good). Check: `node --version`
- A **GitHub** account (repo already targeted: `mraigeneralist/kickd-shoes`)
- Free accounts you'll create below: **Supabase**, **Razorpay**, **Resend**, **Vercel**

---

## 1. Create your Supabase project

1. Go to <https://supabase.com> → **Sign in** → **New project**.
2. Pick an **organization**, give the project a name (e.g. `kickd`), set a strong
   **database password** (save it somewhere), choose the region closest to your
   buyers (e.g. *Mumbai / ap-south-1* for India), and click **Create new project**.
3. Wait ~2 minutes for it to provision.

---

## 2. Run the database schema + seed data

1. In the Supabase dashboard, open **SQL Editor** (left sidebar) → **New query**.
2. Open the file [`supabase/schema.sql`](./supabase/schema.sql) from this repo,
   copy its **entire** contents, paste into the editor, and click **Run**.
   This creates all tables, indexes, Row Level Security policies, the
   auto-profile trigger, the `decrement_stock` function, and the
   `product-images` storage bucket.
3. Open a **New query** again, copy the contents of
   [`supabase/seed.sql`](./supabase/seed.sql), paste, and **Run**.
   This loads the 3 categories, 9 demo products, and UK 6–12 stock.

> Both files are safe to re-run — they use `IF NOT EXISTS` / `ON CONFLICT`.

### The exact SQL you ran
Everything lives in the two files above. The schema covers these tables:
`profiles`, `categories`, `products`, `product_sizes`, `cart_items`,
`orders`, `order_items` — plus RLS policies, indexes, the `is_admin()` and
`decrement_stock()` functions, the new-user trigger, and the storage bucket.

---

## 3. Get your Supabase API keys

1. In Supabase: **Project Settings** (gear icon) → **API**.
2. Copy these three values — you'll paste them into `.env.local` in step 6:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → `anon` `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys → `service_role` `secret`** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ The **service_role** key bypasses all security rules. Keep it secret. It is
> only used on the server (order creation, payment verification) and is **never**
> exposed to the browser. Never commit it.

---

## 4. Create your Razorpay account + test keys

1. Go to <https://razorpay.com> → **Sign up** and complete basic onboarding.
2. In the Razorpay Dashboard, make sure you're in **Test Mode** (toggle at the
   top — it should say *Test Mode*). You can build and test fully before KYC.
3. Go to **Settings → API Keys** → **Generate Test Key**.
4. Copy:
   - **Key Id** (starts with `rzp_test_…`) → both `NEXT_PUBLIC_RAZORPAY_KEY_ID`
     and `RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET` (shown only once — save it now)

You'll use Razorpay **test cards** to place test orders (see step 8).

---

## 5. Create your Resend account (order emails)

1. Go to <https://resend.com> → **Sign up**.
2. **API Keys** → **Create API Key** → copy it → `RESEND_API_KEY`.
3. For the sender (`EMAIL_FROM`):
   - **For testing:** use `Kickd <onboarding@resend.dev>` (works immediately,
     but only delivers to the email you signed up with).
   - **For production:** add and verify your own domain under **Domains** in
     Resend, then use e.g. `Kickd <orders@yourdomain.com>`.

> Email is best-effort: if Resend is misconfigured, orders still complete and
> appear in order history — only the email is skipped (logged on the server).

---

## 6. Create `.env.local`

In the project root, copy the example file and fill in real values:

```bash
# from the kickd-shoes folder
cp .env.local.example .env.local   # Windows PowerShell: Copy-Item .env.local.example .env.local
```

Then edit `.env.local`:

```ini
# Supabase  (step 3)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Razorpay  (step 4 — test keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_secret

# Resend  (step 5)
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=Kickd <onboarding@resend.dev>

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variable | Where it comes from | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → anon public | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role secret | **No** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay → API Keys → Key Id | Yes |
| `RAZORPAY_KEY_ID` | same Key Id | No |
| `RAZORPAY_KEY_SECRET` | Razorpay → API Keys → Key Secret | **No** |
| `RESEND_API_KEY` | Resend → API Keys | **No** |
| `EMAIL_FROM` | your sender identity | No |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your Vercel URL in prod | Yes |

---

## 7. Install dependencies and run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You should see the storefront with the 9 demo
products.

---

## 8. Make yourself an admin & place a test order

1. Click **Sign in → Create an account** and sign up with your email/password.
   - Supabase may require **email confirmation** by default. To skip this while
     testing: Supabase → **Authentication → Providers → Email** → turn **off**
     "Confirm email", then sign up again. (Turn it back on for production.)
2. Make your account an **admin**. In Supabase **SQL Editor**, run:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'YOUR@EMAIL.com');
   ```
   Refresh the site — an **Admin** link appears in the navbar.
3. **Place a test order:** add a product to the cart → **Checkout** → fill the
   shipping address → **Pay**. In the Razorpay test popup use a test card:
   - Card: `4111 1111 1111 1111`, any future expiry, any CVV, any name.
   - (Or use UPI `success@razorpay` in test mode.)
4. After payment you land on the **order confirmation** page, the order shows in
   **My Orders**, stock is decremented, and a confirmation email is sent.

More Razorpay test cards: <https://razorpay.com/docs/payments/payments/test-card-details/>

---

## 9. Add / edit products and upload your real images

You have a built-in admin UI — **no SQL needed** after setup.

1. Sign in as your admin account → click **Admin** in the navbar (`/admin`).
2. **Add product:** click **Add product**, fill name, category, price,
   description, choose an image file (uploaded to the Supabase `product-images`
   bucket), set stock per UK size, optionally mark **Featured**, then **Create**.
3. **Edit product:** click any product row to expand it. Change price, category,
   replace the image, edit per-size stock, toggle **Featured** / **Active**
   (Active off = hidden from the store), then **Save changes**. You can also
   **Delete**.

> The 9 demo products use the images shipped in `/public/images/...`. To replace
> a demo image with a real photo, edit the product in `/admin` and upload a new
> image — it will be stored in Supabase Storage and used everywhere.

---

## 10. Deploy to Vercel

1. Push the code to GitHub (see the repo at `mraigeneralist/kickd-shoes`).
2. Go to <https://vercel.com> → **Add New… → Project** → **Import** your
   `kickd-shoes` GitHub repo. Vercel auto-detects Next.js — keep defaults.
3. Before deploying, add **Environment Variables** (Project → Settings →
   Environment Variables). Add **every** variable from your `.env.local`
   (same names, same values), **except** set:
   - `NEXT_PUBLIC_SITE_URL` → your Vercel URL, e.g. `https://kickd-shoes.vercel.app`
4. Click **Deploy**.
5. **Update Supabase Auth URLs:** Supabase → **Authentication → URL
   Configuration** → set **Site URL** to your Vercel URL and add
   `https://YOUR-APP.vercel.app/auth/callback` under **Redirect URLs**.
6. Redeploy if you changed env vars after the first deploy.

> Every `git push` to `main` triggers an automatic redeploy on Vercel.

---

## 11. Go live: switch Razorpay from Test to Live

Do this only after you've completed Razorpay **KYC / activation**.

1. Razorpay Dashboard → complete **KYC** and get your account **activated**.
2. Switch the dashboard toggle to **Live Mode**.
3. **Settings → API Keys → Generate Live Key**. Copy the live `Key Id`
   (`rzp_live_…`) and `Key Secret`.
4. In **Vercel → Settings → Environment Variables**, replace the test values:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` → `rzp_live_…`
   - `RAZORPAY_KEY_ID` → `rzp_live_…`
   - `RAZORPAY_KEY_SECRET` → live secret
5. **Redeploy.** You're now taking real payments.

> Keep test keys in a local `.env.local` for development; only Vercel needs the
> live keys. Never commit either set.

---

## Troubleshooting

- **"Access denied" on /admin** → your profile isn't admin yet. Re-run the SQL in
  step 8.2, then sign out and back in.
- **Products don't appear** → make sure you ran `seed.sql`, and that products are
  **Active** in `/admin`.
- **Images don't load after admin upload** → confirm the `product-images` bucket
  exists and is **public** (schema.sql creates it as public).
- **Login does nothing / "email not confirmed"** → either confirm via the email
  link, or disable "Confirm email" in Supabase Auth for testing.
- **Payment fails to start** → check the three Razorpay env vars and that you're
  using test keys in test mode.

---

Built with Next.js + Supabase + Razorpay. See [`README.md`](./README.md) for a
developer overview of the codebase.
