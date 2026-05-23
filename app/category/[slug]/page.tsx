import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllProducts,
  getCategories,
  getCategoryBySlug,
  type SortKey,
} from "@/lib/queries";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} at Kickd.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string };
}) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const sort = (searchParams.sort as SortKey) ?? "newest";
  const [products, categories] = await Promise.all([
    getAllProducts({ categorySlug: params.slug, sort }),
    getCategories(),
  ]);

  return (
    <div className="container-x py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Category
        </p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-ink-muted">{category.description}</p>
        )}
      </header>

      <div className="mb-8">
        <ProductFilters
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          lockCategory
        />
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-ink-muted">
          Nothing here yet. Check back soon.
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
