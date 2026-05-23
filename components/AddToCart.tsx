"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import type { ProductWithSizes } from "@/lib/types";

export default function AddToCart({ product }: { product: ProductWithSizes }) {
  const add = useCart((s) => s.add);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);

  const inStock = product.sizes.some((s) => s.stock > 0);

  function handleAdd() {
    if (!selected) {
      setError(true);
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      size: selected,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div>
      {/* Size selector */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Select size (UK)</span>
          {error && !selected && (
            <span className="text-sm font-medium text-brand">Please pick a size</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {product.sizes.map((s) => {
            const out = s.stock <= 0;
            const isSel = selected === s.size;
            return (
              <button
                key={s.id}
                disabled={out}
                onClick={() => {
                  setSelected(s.size);
                  setError(false);
                }}
                className={cn(
                  "relative rounded-lg border py-2.5 text-sm font-semibold transition",
                  out && "cursor-not-allowed border-ink/10 text-ink-subtle line-through opacity-50",
                  !out && isSel && "border-brand bg-brand text-white",
                  !out && !isSel && "border-ink/15 text-ink hover:border-ink/40"
                )}
                title={out ? "Out of stock" : `${s.stock} in stock`}
              >
                {s.size.replace("UK ", "")}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!inStock}
        className={cn("w-full", added ? "btn bg-green-600 text-white" : "btn-primary")}
      >
        {!inStock ? (
          "Out of stock"
        ) : added ? (
          <>
            <Check size={18} /> Added to cart
          </>
        ) : (
          <>
            <ShoppingBag size={18} /> Add to cart
          </>
        )}
      </button>
    </div>
  );
}
