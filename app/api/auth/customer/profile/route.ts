import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

function getPhoneFromCookie() {
  const cookieStore = cookies();
  const val = cookieStore.get("ka_customer")?.value;
  if (!val) return null;
  // Legacy cookies have value "1" instead of a phone number
  if (val === "1") return "legacy";
  return val;
}

// ── GET: fetch current customer profile ─────────────────────────────
export async function GET() {
  const phone = getPhoneFromCookie();

  if (!phone) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (phone === "legacy") {
    return NextResponse.json({ error: "legacy_cookie" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, address, created_at")
    .eq("phone", phone)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ customer: data });
}

// ── PUT: update profile fields ──────────────────────────────────────
export async function PUT(request: NextRequest) {
  const phone = getPhoneFromCookie();
  if (!phone || phone === "legacy") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const newName = body?.name as string | undefined;
  const newPhone = body?.phone as string | undefined;
  const newAddress = body?.address as string | undefined;

  if (newName !== undefined && !newName.trim()) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }
  if (newPhone !== undefined && newPhone.trim().length < 7) {
    return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const updates: Record<string, string | null> = {};
  if (newName !== undefined) updates.name = newName.trim();
  if (newPhone !== undefined) updates.phone = newPhone.trim().replace(/\s+/g, "");
  if (newAddress !== undefined) updates.address = newAddress.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Check phone uniqueness if changing
  if (updates.phone && updates.phone !== phone) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", updates.phone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This phone number is already registered" },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase
    .from("customers")
    .update(updates)
    .eq("phone", phone);

  if (error) {
    console.error("[profile] update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });

  // Update cookie if phone changed
  if (updates.phone && updates.phone !== phone) {
    response.cookies.set("ka_customer", updates.phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

// ── DELETE: remove customer account ─────────────────────────────────
export async function DELETE() {
  const phone = getPhoneFromCookie();
  if (!phone || phone === "legacy") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("phone", phone);

  if (error) {
    console.error("[profile] delete error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("ka_customer", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
