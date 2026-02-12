import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const supabase = createClient();

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, price, product_images(url)")
    .eq("is_active", true)
    .or(
      `name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`
    )
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
