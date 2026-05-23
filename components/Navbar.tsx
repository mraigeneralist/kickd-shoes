"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Menu, X, User, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/store/cart";
import { cartCount } from "@/lib/utils";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/products", label: "All" },
  { href: "/category/sneakers", label: "Sneakers" },
  { href: "/category/running-shoes", label: "Running" },
  { href: "/category/boots", label: "Boots" },
];

export default function Navbar({
  userEmail,
  isAdmin,
}: {
  userEmail: string | null;
  isAdmin: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.openCart);
  const clearCart = useCart((s) => s.clear);
  const count = cartCount(items);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearCart();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight">
          <span className="text-ink">Kick</span>
          <span className="text-brand">d</span>
          <span className="-ml-1 h-2 w-2 rounded-full bg-brand" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition hover:bg-neutral-100",
                pathname === l.href ? "text-brand" : "text-ink-muted hover:text-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink sm:flex"
            >
              <ShieldCheck size={18} /> Admin
            </Link>
          )}

          {userEmail ? (
            <>
              <Link
                href="/orders"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink sm:block"
              >
                Orders
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink sm:flex"
              >
                <LogOut size={18} /> Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink sm:flex"
            >
              <User size={18} /> Sign in
            </Link>
          )}

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative rounded-full p-2.5 text-ink hover:bg-neutral-100"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2.5 text-ink hover:bg-neutral-100 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-ink/5 bg-white md:hidden">
          <nav className="container-x flex flex-col py-3">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-neutral-100"
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-ink/5" />
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-neutral-100">
                Admin
              </Link>
            )}
            {userEmail ? (
              <>
                <Link href="/orders" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-neutral-100">
                  My Orders
                </Link>
                <button onClick={handleSignOut} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-muted hover:bg-neutral-100">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-neutral-100">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
