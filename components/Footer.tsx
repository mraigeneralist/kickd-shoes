import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/5 bg-neutral-50">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-1 text-2xl font-extrabold tracking-tight">
            <span className="text-ink">Kick</span>
            <span className="text-brand">d</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            Premium footwear, minimal design. Step up your game with Kickd.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/category/sneakers" className="hover:text-brand">Sneakers</Link></li>
            <li><Link href="/category/running-shoes" className="hover:text-brand">Running Shoes</Link></li>
            <li><Link href="/category/boots" className="hover:text-brand">Boots</Link></li>
            <li><Link href="/products" className="hover:text-brand">All Products</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/login" className="hover:text-brand">Sign in</Link></li>
            <li><Link href="/signup" className="hover:text-brand">Create account</Link></li>
            <li><Link href="/orders" className="hover:text-brand">My orders</Link></li>
            <li><Link href="/cart" className="hover:text-brand">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink">Help</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>Free shipping across India</li>
            <li>Secure payments via Razorpay</li>
            <li>support@kickd.example</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/5">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} Kickd. All rights reserved.</p>
          <p>Made for sneakerheads · Built with Next.js + Supabase</p>
        </div>
      </div>
    </footer>
  );
}
