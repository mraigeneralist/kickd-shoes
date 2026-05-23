import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { getProductBySlug } from "@/lib/queries";
import { formatINR } from "@/lib/utils";
import AddToCart from "@/components/AddToCart";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.description ?? `Buy ${product.name} at Kickd.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  return (
    <div className="container-x py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-2">/</span>
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-brand">
              {product.category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-neutral-100">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          )}
          {product.is_featured && (
            <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Featured
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.category && (
            <Link
              href={`/category/${product.category.slug}`}
              className="text-sm font-medium uppercase tracking-wide text-brand hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-bold text-ink">
            {formatINR(product.price)}
          </p>
          {product.description && (
            <p className="mt-5 leading-relaxed text-ink-muted">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          {/* Perks */}
          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-ink/5 pt-6 sm:grid-cols-3">
            {[
              { icon: Truck, text: "Free shipping" },
              { icon: RotateCcw, text: "7-day returns" },
              { icon: ShieldCheck, text: "Secure payment" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-ink-muted">
                <f.icon size={18} className="text-brand" />
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
