"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  ShieldCheck,
  Package,
  ChevronDown,
} from "lucide-react";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.openCart);
  const clearCart = useCart((s) => s.clear);
  const count = cartCount(items);

  // Close the profile dropdown on outside click or Escape.
  useEffect(() => {
    if (!profileOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  // Close the dropdown whenever the route changes.
  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

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
          {userEmail ? (
            // Profile dropdown
            <div ref={profileRef} className="relative hidden sm:block">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold uppercase text-white">
                  {userEmail.charAt(0)}
                </span>
                <ChevronDown
                  size={16}
                  className={cn("transition-transform", profileOpen && "rotate-180")}
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-ink/10 bg-white py-1.5 shadow-card-hover"
                >
                  <div className="border-b border-ink/5 px-4 py-3">
                    <p className="text-xs text-ink-subtle">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-ink">{userEmail}</p>
                  </div>
                  <Link
                    href="/account"
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink"
                  >
                    <User size={18} /> My Profile
                  </Link>
                  <Link
                    href="/orders"
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink"
                  >
                    <Package size={18} /> My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink"
                    >
                      <ShieldCheck size={18} /> Admin
                    </Link>
                  )}
                  <div className="my-1 h-px bg-ink/5" />
                  <button
                    onClick={handleSignOut}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-ink-muted hover:bg-neutral-100 hover:text-ink"
                  >
                    <LogOut size={18} /> Sign out
                  </button>
                </div>
              )}
            </div>
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
                <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-neutral-100">
                  My Profile
                </Link>
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
