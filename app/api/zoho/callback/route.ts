import { NextRequest, NextResponse } from "next/server";
import { storeInitialTokens } from "@/lib/zoho/client";

const ZOHO_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";

/**
 * GET /api/zoho/callback
 * Handles the Zoho OAuth redirect. Exchanges the authorization code for
 * access + refresh tokens and stores them in store_settings.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const settingsUrl = new URL("/admin/settings", request.url);

  if (error || !code) {
    settingsUrl.searchParams.set(
      "zoho_error",
      error ?? "No authorization code received"
    );
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      redirect_uri: process.env.ZOHO_REDIRECT_URI!,
      code,
    });

    const res = await fetch(`${ZOHO_TOKEN_URL}?${params.toString()}`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Token exchange failed: ${body}`);
    }

    const json = await res.json();

    if (json.error) {
      throw new Error(`Zoho error: ${json.error}`);
    }

    if (!json.refresh_token) {
      throw new Error(
        "No refresh token returned. Revoke app access in Zoho API Console and try again."
      );
    }

    await storeInitialTokens(
      json.access_token,
      json.refresh_token,
      json.expires_in ?? 3600
    );

    settingsUrl.searchParams.set("zoho_connected", "1");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    settingsUrl.searchParams.set("zoho_error", msg);
    return NextResponse.redirect(settingsUrl);
  }
}
