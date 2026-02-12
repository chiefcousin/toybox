import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { product_id } = await request.json();
    if (!product_id) {
      return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase.from("product_views").insert({ product_id });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
