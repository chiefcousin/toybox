import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = body?.phone as string | undefined;
  const name = body?.name as string | undefined;
  const address = body?.address as string | undefined;

  if (!phone || !name || !name.trim()) {
    return NextResponse.json({ error: "Phone and name are required" }, { status: 400 });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, "");
  const supabase = createAdminClient();

  // Ensure the customer is verified before completing signup
  const { data: customer } = await supabase
    .from("customers")
    .select("id, is_verified")
    .eq("phone", cleanPhone)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 400 });
  }

  if (!customer.is_verified) {
    return NextResponse.json({ error: "Phone number not verified" }, { status: 400 });
  }

  const { error } = await supabase
    .from("customers")
    .update({ name: name.trim(), address: address?.trim() || null })
    .eq("phone", cleanPhone);

  if (error) {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
