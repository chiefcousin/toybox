import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();
  const { data: callerRole } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // No role row = admin; explicit admin role = admin
  if (callerRole && callerRole.role !== "admin") return null;

  return adminClient;
}

// GET: List all customers
export async function GET() {
  const adminClient = await verifyAdmin();
  if (!adminClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await adminClient
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customers: data });
}

// POST: Add a new customer
export async function POST(request: NextRequest) {
  const adminClient = await verifyAdmin();
  if (!adminClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name as string | undefined;
  const phone = body?.phone as string | undefined;
  const address = body?.address as string | undefined;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!phone || phone.trim().length < 7) {
    return NextResponse.json(
      { error: "Valid phone number is required" },
      { status: 400 }
    );
  }

  const cleanPhone = phone.trim().replace(/\s+/g, "");

  const { error } = await adminClient.from("customers").upsert(
    {
      phone: cleanPhone,
      name: name.trim(),
      address: address?.trim() || null,
      is_verified: true,
    },
    { onConflict: "phone" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: Remove a customer by id
export async function DELETE(request: NextRequest) {
  const adminClient = await verifyAdmin();
  if (!adminClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await adminClient
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
