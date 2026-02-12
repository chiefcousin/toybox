"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AGE_RANGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FilterSidebar({
  categories,
  brands,
  currentFilters,
}: {
  categories: { name: string; slug: string }[];
  brands: string[];
  currentFilters: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/products");
  }

  const hasFilters = Object.keys(currentFilters).some(
    (k) => k !== "sort" && k !== "page"
  );

  return (
    <div className="space-y-6">
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear all filters
        </Button>
      )}

      {/* Category */}
      <div>
        <Label className="mb-2 block text-sm font-semibold">Category</Label>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() =>
                setFilter(
                  "category",
                  currentFilters.category === cat.slug ? null : cat.slug
                )
              }
              className={`block w-full rounded px-2 py-1 text-left text-sm transition-colors ${
                currentFilters.category === cat.slug
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Age Range */}
      <div>
        <Label className="mb-2 block text-sm font-semibold">Age Range</Label>
        <div className="space-y-1">
          {AGE_RANGES.map((range) => (
            <button
              key={range}
              onClick={() =>
                setFilter(
                  "age_range",
                  currentFilters.age_range === range ? null : range
                )
              }
              className={`block w-full rounded px-2 py-1 text-left text-sm transition-colors ${
                currentFilters.age_range === range
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <Label className="mb-2 block text-sm font-semibold">Brand</Label>
          <div className="space-y-1">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() =>
                  setFilter(
                    "brand",
                    currentFilters.brand === b ? null : b
                  )
                }
                className={`block w-full rounded px-2 py-1 text-left text-sm transition-colors ${
                  currentFilters.brand === b
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <Label className="mb-2 block text-sm font-semibold">Price Range</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={currentFilters.min_price || ""}
            onBlur={(e) => setFilter("min_price", e.target.value || null)}
            className="w-full"
          />
          <Input
            type="number"
            placeholder="Max"
            defaultValue={currentFilters.max_price || ""}
            onBlur={(e) => setFilter("max_price", e.target.value || null)}
            className="w-full"
          />
        </div>
      </div>

      {/* In Stock */}
      <div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={currentFilters.in_stock === "true"}
            onChange={(e) =>
              setFilter("in_stock", e.target.checked ? "true" : null)
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm">In stock only</span>
        </label>
      </div>
    </div>
  );
}
