"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { cartTotal, formatINR } from "@/lib/utils";

export default function CartPage() {
  const { items, setQuantity, remove } = useCart();
  const total = cartTotal(items);

  if (items.length === 0) {
    return (
      <div className="container-x flex flex-col items-center justify-center gap-4 py-28 text-center">
        <ShoppingBag size={48} className="text-ink-subtle" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-ink-muted">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products" className="btn-primary mt-2">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl font-extrabold tracking-tight">Your Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <ul className="divide-y divide-ink/5 rounded-2xl border border-ink/5">
            {items.map((i) => (
              <li key={`${i.productId}-${i.size}`} className="flex gap-4 p-4 sm:p-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {i.imageUrl && (
                    <Image src={i.imageUrl} alt={i.name} fill className="object-cover" sizes="96px" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/product/${i.slug}`} className="font-semibold hover:text-brand">
                        {i.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-ink-muted">Size {i.size}</p>
                    </div>
                    <span className="font-semibold">{formatINR(i.price * i.quantity)}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-full border border-ink/10">
                      <button onClick={() => setQuantity(i.productId, i.size, i.quantity - 1)} className="p-2 hover:text-brand" aria-label="Decrease">
                        <Minus size={15} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{i.quantity}</span>
                      <button onClick={() => setQuantity(i.productId, i.size, i.quantity + 1)} className="p-2 hover:text-brand" aria-label="Increase">
                        <Plus size={15} />
                      </button>
                    </div>
                    <button onClick={() => remove(i.productId, i.size)} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand">
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-ink/5 bg-neutral-50 p-6">
            <h2 className="text-lg font-bold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-medium">{formatINR(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd className="font-medium text-brand">FREE</dd>
              </div>
              <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatINR(total)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn-primary mt-6 w-full">
              Checkout <ArrowRight size={18} />
            </Link>
            <Link href="/products" className="btn-ghost mt-2 w-full">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
