import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: Invite a staff member by email and assign a role
export async function POST(request: NextRequest) {
  // Verify the caller is an authenticated admin
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Check that the caller is an admin (no role row = admin)
  const { data: callerRole } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (callerRole && callerRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body as { email: string; role: string };

  if (!email || !role || !["partner", "staff"].includes(role)) {
    return NextResponse.json({ error: "email and role (partner|staff) are required" }, { status: 400 });
  }

  // Invite the user via Supabase Auth (sends an email invite)
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const invitedUserId = inviteData.user?.id;
  if (!invitedUserId) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Upsert their role
  const { error: roleError } = await adminClient
    .from("user_roles")
    .upsert({ user_id: invitedUserId, role }, { onConflict: "user_id" });

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user_id: invitedUserId });
}

// DELETE: Remove a staff member's access (delete their role row)
export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  const { data: callerRole } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (callerRole && callerRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { user_id } = body as { user_id: string };

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const { error } = await adminClient
    .from("user_roles")
    .delete()
    .eq("user_id", user_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET: List all staff/partner users
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  const { data: roles, error } = await adminClient
    .from("user_roles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch email for each user from auth admin API
  const staff = await Promise.all(
    (roles || []).map(async (row) => {
      const { data } = await adminClient.auth.admin.getUserById(row.user_id);
      return {
        user_id: row.user_id,
        role: row.role,
        created_at: row.created_at,
        email: data.user?.email || "Unknown",
      };
    })
  );

  return NextResponse.json({ staff });
}
