import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { product_id, product_name, price, quantity } = await request.json();

    if (!product_name || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("whatsapp_orders").insert({
      product_id,
      product_name,
      price,
      quantity: quantity || 1,
      status: "clicked",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to log order" },
      { status: 500 }
    );
  }
}
