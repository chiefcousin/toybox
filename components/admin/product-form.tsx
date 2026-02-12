"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "./image-uploader";
import { AGE_RANGES } from "@/lib/constants";
import type { Product, ProductImage, Category } from "@/lib/types";

interface ProductFormProps {
  product?: Product & { product_images?: ProductImage[] };
  categories: Category[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const isEdit = !!product;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compare_at_price?.toString() || ""
  );
  const [sku, setSku] = useState(product?.sku || "");
  const [stockQuantity, setStockQuantity] = useState(
    product?.stock_quantity?.toString() || "0"
  );
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [brand, setBrand] = useState(product?.brand || "");
  const [ageRange, setAgeRange] = useState(product?.age_range || "");
  const [tags, setTags] = useState(product?.tags?.join(", ") || "");
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.product_images?.map((img) => img.url) || []
  );

  function handleNameChange(value: string) {
    setName(value);
    if (!isEdit) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast({
        title: "Validation Error",
        description: "Name and price are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const productData = {
      name: name.trim(),
      slug: slug || generateSlug(name),
      description: description.trim() || null,
      price: parseFloat(price),
      compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
      sku: sku.trim() || null,
      stock_quantity: parseInt(stockQuantity, 10) || 0,
      category_id: categoryId || null,
      brand: brand.trim() || null,
      age_range: ageRange || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_featured: isFeatured,
      is_active: isActive,
    };

    let productId = product?.id;

    if (isEdit && productId) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", productId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select("id")
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      productId = data.id;
    }

    // Sync images
    if (productId) {
      // Delete existing images
      await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);

      // Insert new images
      if (imageUrls.length > 0) {
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: productId!,
          url,
          sort_order: index,
          is_primary: index === 0,
        }));
        await supabase.from("product_images").insert(imageRecords);
      }
    }

    toast({
      title: isEdit ? "Updated" : "Created",
      description: `Product "${name}" has been ${isEdit ? "updated" : "created"}.`,
    });

    router.push("/admin/products");
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="font-semibold">Product Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="font-semibold">Images</h2>
            <ImageUploader images={imageUrls} onChange={setImageUrls} />
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="font-semibold">Pricing & Inventory</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compare_at_price">Compare at Price</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="font-semibold">Organization</h2>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age_range">Age Range</Label>
              <select
                id="age_range"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Not specified</option>
                {AGE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="wooden, educational, STEM"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="font-semibold">Visibility</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Active (visible in store)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Featured on homepage</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : isEdit
            ? "Update Product"
            : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
