import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  ProductWithCategory,
  ProductWithSizes,
} from "@/lib/types";

export type SortKey = "newest" | "price-asc" | "price-desc";

function applySort(query: any, sort: SortKey) {
  switch (sort) {
    case "price-asc":
      return query.order("price", { ascending: true });
    case "price-desc":
      return query.order("price", { ascending: false });
    default:
      return query.order("created_at", { ascending: false });
  }
}

const PRODUCT_SELECT =
  "*, category:categories(id, name, slug)";

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function getFeaturedProducts(
  limit = 4
): Promise<ProductWithCategory[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ProductWithCategory[]) ?? [];
}

export async function getAllProducts(
  opts: { categorySlug?: string; sort?: SortKey } = {}
): Promise<ProductWithCategory[]> {
  const supabase = createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true);

  if (opts.categorySlug) {
    const cat = await getCategoryBySlug(opts.categorySlug);
    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }

  query = applySort(query, opts.sort ?? "newest");
  const { data } = await query;
  return (data as ProductWithCategory[]) ?? [];
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithSizes | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id, name, slug), sizes:product_sizes(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (!data) return null;

  // Order sizes by their UK number for a tidy selector.
  const product = data as ProductWithSizes;
  product.sizes = [...product.sizes].sort((a, b) => {
    const na = parseInt(a.size.replace(/\D/g, ""), 10);
    const nb = parseInt(b.size.replace(/\D/g, ""), 10);
    return na - nb;
  });
  return product;
}
