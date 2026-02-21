import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/storefront/product-grid";
import type { Metadata } from "next";
import type { ProductWithPrimaryImage } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", params.slug)
    .single();

  if (!category) return { title: "Category Not Found" };
  return {
    title: category.name,
    description: `Browse ${category.name} toys at Kaira Enterprises`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(url, alt_text), categories(name, slug)")
    .eq("is_active", true)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">{category.name}</h1>
      <p className="mb-8 text-muted-foreground">
        {(products || []).length} product
        {(products || []).length !== 1 ? "s" : ""} in this category
      </p>
      <ProductGrid
        products={(products || []) as unknown as ProductWithPrimaryImage[]}
        emptyMessage={`No products in ${category.name} yet`}
      />
    </div>
  );
}
