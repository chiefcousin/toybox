import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import type { Category } from "@/lib/types";

export default async function NewProductPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add Product</h1>
      <ProductForm categories={(categories || []) as Category[]} />
    </div>
  );
}
