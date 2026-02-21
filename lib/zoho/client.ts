import { createAdminClient } from "@/lib/supabase/admin";

const ZOHO_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";
const ZOHO_API_BASE = "https://www.zohoapis.com/inventory/v1";

// ---------------------------------------------------------------------------
// Token storage (uses store_settings key-value table via admin client)
// ---------------------------------------------------------------------------

interface TokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix ms
}

async function getTokenRecord(): Promise<TokenRecord | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", [
      "zoho_access_token",
      "zoho_refresh_token",
      "zoho_token_expires_at",
    ]);

  if (!data || data.length === 0) return null;

  const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
  if (!map.zoho_refresh_token) return null;

  return {
    accessToken: map.zoho_access_token ?? "",
    refreshToken: map.zoho_refresh_token,
    expiresAt: parseInt(map.zoho_token_expires_at ?? "0", 10),
  };
}

async function storeTokens(
  accessToken: string,
  refreshToken: string,
  expiresInSeconds: number
): Promise<void> {
  const supabase = createAdminClient();
  // Subtract 60s buffer so we refresh before the token actually expires
  const expiresAt = Date.now() + expiresInSeconds * 1000 - 60_000;
  const now = new Date().toISOString();

  const rows = [
    { key: "zoho_access_token", value: accessToken, updated_at: now },
    { key: "zoho_refresh_token", value: refreshToken, updated_at: now },
    {
      key: "zoho_token_expires_at",
      value: String(expiresAt),
      updated_at: now,
    },
  ];

  for (const row of rows) {
    await supabase
      .from("store_settings")
      .upsert(row, { onConflict: "key" });
  }
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ZOHO_CLIENT_ID!,
    client_secret: process.env.ZOHO_CLIENT_SECRET!,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${ZOHO_TOKEN_URL}?${params.toString()}`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoho token refresh failed: ${body}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(`Zoho token error: ${json.error}`);
  }

  // Zoho may rotate the refresh token — use the new one if returned
  const newRefreshToken = json.refresh_token ?? refreshToken;
  await storeTokens(json.access_token, newRefreshToken, json.expires_in ?? 3600);
  return json.access_token;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns a valid access token, auto-refreshing if expired. */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await getTokenRecord();
  if (!tokens) {
    throw new Error(
      "Zoho Inventory is not connected. Complete OAuth from Admin → Settings."
    );
  }

  if (Date.now() < tokens.expiresAt && tokens.accessToken) {
    return tokens.accessToken;
  }

  return refreshAccessToken(tokens.refreshToken);
}

/** Stores tokens after the initial OAuth code exchange. */
export async function storeInitialTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  await storeTokens(accessToken, refreshToken, expiresIn);
}

/** Returns true if Zoho has been connected (refresh token exists). */
export async function isZohoConnected(): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "zoho_refresh_token")
    .maybeSingle();
  return !!data?.value;
}

/**
 * Authenticated fetch wrapper for Zoho Inventory API.
 * Automatically injects Authorization header and organization_id query param.
 */
export async function zohoFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getValidAccessToken();
  const orgId = process.env.ZOHO_ORG_ID!;

  const url = new URL(`${ZOHO_API_BASE}${path}`);
  url.searchParams.set("organization_id", orgId);

  return fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}
