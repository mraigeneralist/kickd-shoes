import type { Metadata } from "next";
import { getAllProducts, getCategories, type SortKey } from "@/lib/queries";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse the full Kickd collection of sneakers, running shoes, and boots.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const sort = (searchParams.sort as SortKey) ?? "newest";
  const [products, categories] = await Promise.all([
    getAllProducts({ categorySlug: searchParams.category, sort }),
    getCategories(),
  ]);

  return (
    <div className="container-x py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">All Products</h1>
        <p className="mt-1 text-ink-muted">
          {products.length} {products.length === 1 ? "style" : "styles"} available
        </p>
      </header>

      <div className="mb-8">
        <ProductFilters
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        />
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-ink-muted">
          No products found. Try a different filter.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
