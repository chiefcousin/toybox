/**
 * Kaira Enterprises — Database Migration Runner
 * Run: node migrate.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ── Parse .env.local ──────────────────────────────────────────────────────
const raw = readFileSync(".env.local", "utf8");
const env = {};
raw.split(/\r?\n/).forEach((line) => {
  line = line.trim();
  if (!line || line.startsWith("#") || !line.includes("=")) return;
  const idx = line.indexOf("=");
  env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || SUPABASE_URL.includes("your-") || !SERVICE_KEY || SERVICE_KEY.includes("your-")) {
  console.error("❌  Please fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Migration SQL ─────────────────────────────────────────────────────────
const migrations = [
  {
    name: "002_customers_table",
    sql: `
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL UNIQUE,
  address TEXT,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone);
CREATE INDEX IF NOT EXISTS customers_is_verified_idx ON customers (is_verified);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Service role full access on customers') THEN
    CREATE POLICY "Service role full access on customers" ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Public can insert customers') THEN
    CREATE POLICY "Public can insert customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Public can select own customer by phone') THEN
    CREATE POLICY "Public can select own customer by phone" ON customers FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;
CREATE OR REPLACE FUNCTION update_customers_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $fn$;
DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();`,
  },
  {
    name: "003_user_roles",
    sql: `
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','partner','staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles (user_id);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='Service role full access on user_roles') THEN
    CREATE POLICY "Service role full access on user_roles" ON user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='Users can read their own role') THEN
    CREATE POLICY "Users can read their own role" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;`,
  },
  {
    name: "004_product_video",
    sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;`,
  },
  {
    name: "005_analytics_functions",
    sql: `
DROP FUNCTION IF EXISTS get_product_sales_analytics(INT);
CREATE OR REPLACE FUNCTION get_product_sales_analytics(days_back INT DEFAULT 30)
RETURNS TABLE(product_id UUID, product_name TEXT, views BIGINT, clicks BIGINT, fulfilled BIGINT, revenue NUMERIC)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.id, p.name,
    COUNT(DISTINCT pv.id) AS views,
    COUNT(DISTINCT wo.id) FILTER (WHERE wo.status != 'cancelled') AS clicks,
    COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'fulfilled') AS fulfilled,
    COALESCE(SUM(wo.price*wo.quantity) FILTER (WHERE wo.status='fulfilled'),0) AS revenue
  FROM products p
  LEFT JOIN product_views pv ON pv.product_id=p.id AND pv.viewed_at >= NOW()-(days_back||' days')::INTERVAL
  LEFT JOIN whatsapp_orders wo ON wo.product_id=p.id AND wo.created_at >= NOW()-(days_back||' days')::INTERVAL
  GROUP BY p.id, p.name ORDER BY fulfilled DESC, clicks DESC, views DESC
$$;
GRANT EXECUTE ON FUNCTION get_product_sales_analytics(INT) TO authenticated, service_role;

DROP FUNCTION IF EXISTS get_returning_customers_count();
CREATE OR REPLACE FUNCTION get_returning_customers_count() RETURNS BIGINT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM (
    SELECT customer_phone FROM whatsapp_orders WHERE customer_phone IS NOT NULL GROUP BY customer_phone HAVING COUNT(*)>1
  ) AS t
$$;
GRANT EXECUTE ON FUNCTION get_returning_customers_count() TO authenticated, service_role;`,
  },
];

// ── Runner ────────────────────────────────────────────────────────────────
// Supabase JS SDK doesn't run raw SQL; we use the Postgres REST endpoint
// that Supabase exposes at /rest/v1/rpc/<function> — but for arbitrary SQL
// we need the pg endpoint OR a pre-installed exec_sql helper function.
// Strategy: POST to the Supabase SQL-over-HTTP endpoint (available to service role).

async function execSQL(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.status === 404) {
    // exec_sql RPC doesn't exist yet — create it first via the pg endpoint
    return { needsBootstrap: true };
  }

  const text = await res.text();
  if (!res.ok) return { error: text };
  return { ok: true };
}

async function bootstrapExecSQL() {
  // Create a helper function using the Supabase Management API
  const projectRef = SUPABASE_URL.match(/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!projectRef) return false;

  const bootstrapSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN EXECUTE query; END; $$;
    GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
  `;

  // Try Supabase pg REST endpoint
  const endpoints = [
    `${SUPABASE_URL}/pg`,
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: bootstrapSQL }),
    }).catch(() => null);

    if (res?.ok) return true;
  }
  return false;
}

async function main() {
  console.log("Kaira Enterprises — Migration Runner");
  console.log("=====================================");
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  // Test connection
  const { error: connErr } = await supabase.from("products").select("id").limit(1);
  if (connErr) {
    console.error("❌  Connection failed:", connErr.message);
    process.exit(1);
  }
  console.log("✓  Connected to Supabase\n");

  // Try to run migrations
  for (const m of migrations) {
    process.stdout.write(`Running ${m.name}... `);
    const result = await execSQL(m.sql);

    if (result.needsBootstrap) {
      process.stdout.write("bootstrapping exec_sql... ");
      const ok = await bootstrapExecSQL();
      if (!ok) {
        console.log("\n");
        console.log("⚠️  Cannot run SQL automatically — exec_sql helper not available.");
        console.log("    Run migrations manually in the Supabase SQL editor:\n");
        for (const mg of migrations) {
          console.log(`--- ${mg.name} ---`);
          console.log(mg.sql.trim());
          console.log();
        }
        console.log(`SQL editor: ${SUPABASE_URL.replace('.supabase.co', '').replace('https://', 'https://')}.supabase.com → SQL Editor`);
        return;
      }
      // Retry
      const retry = await execSQL(m.sql);
      if (retry.error) { console.log(`❌  ${retry.error}`); continue; }
      console.log("✓");
    } else if (result.error) {
      console.log(`❌  ${result.error}`);
    } else {
      console.log("✓");
    }
  }

  console.log("\n✅  All migrations complete!");
  console.log("\nNext steps:");
  console.log("  1. Create a 'product-videos' storage bucket in Supabase (public, like 'product-images')");
  console.log("  2. Rename GitHub repo: gh repo rename kaira-enterprises");
  console.log("  3. Rename Vercel project in the Vercel dashboard");
}

main().catch(console.error);
