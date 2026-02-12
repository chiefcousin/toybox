import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/storefront/product-grid";
import type { Metadata } from "next";
import type { ProductWithPrimaryImage } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search Results",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() || "";
  const supabase = createClient();

  let products: ProductWithPrimaryImage[] = [];

  if (query) {
    const { data } = await supabase
      .from("products")
      .select("*, product_images(url, alt_text), categories(name, slug)")
      .eq("is_active", true)
      .or(
        `name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`
      )
      .order("name")
      .limit(50);

    products = (data || []) as unknown as ProductWithPrimaryImage[];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">
        {query ? `Results for "${query}"` : "Search"}
      </h1>
      {query && (
        <p className="mb-8 text-muted-foreground">
          {products.length} result{products.length !== 1 ? "s" : ""} found
        </p>
      )}
      {query ? (
        <ProductGrid
          products={products}
          emptyMessage={`No results for "${query}"`}
        />
      ) : (
        <p className="py-16 text-center text-muted-foreground">
          Enter a search term to find toys
        </p>
      )}
    </div>
  );
}
