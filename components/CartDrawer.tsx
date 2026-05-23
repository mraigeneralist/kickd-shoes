"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { cartTotal, formatINR } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeCart, setQuantity, remove } = useCart();
  const total = cartTotal(items);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/5 p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag size={20} className="text-brand" /> Your Cart
          </h2>
          <button onClick={closeCart} className="rounded-full p-2 hover:bg-neutral-100" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag size={40} className="text-ink-subtle" />
            <p className="font-medium text-ink">Your cart is empty</p>
            <p className="text-sm text-ink-muted">Find your next pair.</p>
            <Link href="/products" onClick={closeCart} className="btn-primary mt-2">
              Shop now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.map((i) => (
                <div key={`${i.productId}-${i.size}`} className="flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {i.imageUrl && (
                      <Image src={i.imageUrl} alt={i.name} fill className="object-cover" sizes="80px" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${i.slug}`} onClick={closeCart} className="text-sm font-semibold leading-tight hover:text-brand">
                        {i.name}
                      </Link>
                      <button onClick={() => remove(i.productId, i.size)} className="text-ink-subtle hover:text-brand" aria-label="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">Size {i.size}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-ink/10">
                        <button onClick={() => setQuantity(i.productId, i.size, i.quantity - 1)} className="p-1.5 hover:text-brand" aria-label="Decrease">
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{i.quantity}</span>
                        <button onClick={() => setQuantity(i.productId, i.size, i.quantity + 1)} className="p-1.5 hover:text-brand" aria-label="Increase">
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{formatINR(i.price * i.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink/5 p-5">
              <div className="mb-1 flex items-center justify-between text-sm text-ink-muted">
                <span>Shipping</span>
                <span className="font-medium text-brand">FREE</span>
              </div>
              <div className="mb-4 flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
              <Link href="/checkout" onClick={closeCart} className="btn-primary w-full">
                Checkout
              </Link>
              <Link href="/cart" onClick={closeCart} className="btn-ghost mt-2 w-full">
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
