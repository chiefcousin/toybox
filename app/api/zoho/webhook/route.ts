import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSingleItemFromZoho } from "@/lib/zoho/sync";
import type { ZohoWebhookPayload } from "@/lib/zoho/types";

/**
 * POST /api/zoho/webhook?token=<secret>
 *
 * Receives item change events from Zoho Inventory and updates Kaira Enterprises products.
 *
 * To register this webhook in Zoho:
 *   Zoho Inventory → Settings → Webhooks → New Webhook
 *   URL: https://yourdomain.com/api/zoho/webhook?token=<zoho_webhook_token>
 *   Events: Item Created, Item Updated, Item Deleted
 *
 * Always returns HTTP 200 — Zoho retries on non-2xx, which can cause loops.
 */
export async function POST(request: NextRequest) {
  // 1. Validate webhook secret
  const incomingToken = request.nextUrl.searchParams.get("token");

  const supabase = createAdminClient();
  const { data: tokenRow } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "zoho_webhook_token")
    .maybeSingle();

  if (!tokenRow?.value || tokenRow.value !== incomingToken) {
    // Return 200 (not 401) to prevent Zoho from spamming retries
    console.warn("[Zoho Webhook] Invalid or missing token");
    return NextResponse.json({ ok: false, error: "Invalid token" });
  }

  // 2. Parse body
  let payload: ZohoWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" });
  }

  const { event_type, data } = payload;

  // 3. Handle events
  try {
    if (event_type === "item_created" || event_type === "item_updated") {
      await syncSingleItemFromZoho(data.item.item_id);
    } else if (event_type === "item_deleted") {
      // Soft-delete: keeps foreign key references intact in whatsapp_orders
      await supabase
        .from("products")
        .update({ is_active: false })
        .eq("zoho_item_id", data.item.item_id);
    }
  } catch (err) {
    // Log but return 200 to prevent Zoho retry loops
    console.error("[Zoho Webhook] Error processing event:", err);
    return NextResponse.json({ ok: false, error: String(err) });
  }

  return NextResponse.json({ ok: true });
}
