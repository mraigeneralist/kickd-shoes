import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { ProductWithCategory } from "@/lib/types";

export default function ProductCard({
  product,
}: {
  product: ProductWithCategory;
}) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-subtle">
            No image
          </div>
        )}
        {product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 font-semibold leading-tight text-ink group-hover:text-brand">
          {product.name}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-ink">
            {formatINR(product.price)}
          </span>
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors duration-300 group-hover:border-brand group-hover:bg-brand group-hover:text-white"
          >
            <ArrowUpRight
              size={18}
              className="transition-transform duration-300 group-hover:rotate-45"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
