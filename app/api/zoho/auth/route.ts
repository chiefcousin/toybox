import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ZOHO_AUTH_URL = "https://accounts.zoho.com/oauth/v2/auth";

/**
 * GET /api/zoho/auth
 * Redirects the admin to the Zoho OAuth consent screen.
 * Protected — requires an authenticated admin session.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOHO_CLIENT_ID!,
    scope: [
      "ZohoInventory.items.READ",
      "ZohoInventory.items.UPDATE",
      "ZohoInventory.salesorders.CREATE",
      "ZohoInventory.salesorders.READ",
    ].join(","),
    redirect_uri: process.env.ZOHO_REDIRECT_URI!,
    access_type: "offline", // required to receive a refresh token
    prompt: "consent", // always issue a fresh refresh token
  });

  return NextResponse.redirect(`${ZOHO_AUTH_URL}?${params.toString()}`);
}
