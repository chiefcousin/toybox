import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import type { Category, Product, ProductImage } from "@/lib/types";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [productResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("id", params.id)
      .single(),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  if (!productResult.data) notFound();

  const product = productResult.data as unknown as Product & {
    product_images: ProductImage[];
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Product</h1>
      <ProductForm
        product={product}
        categories={(categoriesResult.data || []) as Category[]}
      />
    </div>
  );
}
