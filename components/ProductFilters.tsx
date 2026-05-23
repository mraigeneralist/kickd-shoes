"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type CatOption = { slug: string; name: string };

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

/**
 * Filter/sort bar for the /products listing. Pushes state into the URL query
 * string so the server component re-renders with the filtered results.
 * On a category page the category pills are hidden (lockCategory).
 */
export default function ProductFilters({
  categories,
  lockCategory = false,
}: {
  categories: CatOption[];
  lockCategory?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeCat = params.get("category") ?? "";
  const activeSort = params.get("sort") ?? "newest";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {!lockCategory && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setParam("category", "")}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              !activeCat
                ? "border-brand bg-brand text-white"
                : "border-ink/15 text-ink-muted hover:border-ink/40"
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setParam("category", c.slug)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                activeCat === c.slug
                  ? "border-brand bg-brand text-white"
                  : "border-ink/15 text-ink-muted hover:border-ink/40"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm text-ink-muted">
          Sort
        </label>
        <select
          id="sort"
          value={activeSort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
