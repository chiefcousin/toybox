-- Migration: Add Zoho Inventory integration fields
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- Add Zoho item link to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS zoho_item_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_synced_from_zoho TIMESTAMPTZ;

-- Fast lookups when Zoho webhook fires with an item_id
CREATE INDEX IF NOT EXISTS idx_products_zoho_item_id
  ON products(zoho_item_id)
  WHERE zoho_item_id IS NOT NULL;

-- Add Zoho sales order tracking to whatsapp_orders table
ALTER TABLE whatsapp_orders
  ADD COLUMN IF NOT EXISTS zoho_sales_order_id TEXT,
  ADD COLUMN IF NOT EXISTS zoho_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS zoho_synced_at TIMESTAMPTZ;

-- Zoho tokens and sync state are stored in the existing store_settings table
-- as key-value rows (no schema change needed). Keys used:
--   zoho_refresh_token     - long-lived OAuth refresh token
--   zoho_access_token      - short-lived access token (expires in ~1 hour)
--   zoho_token_expires_at  - Unix timestamp (ms) when access token expires
--   zoho_last_sync_at      - ISO timestamp of last successful product sync
--   zoho_sync_status       - 'idle' | 'syncing' | 'error'
--   zoho_sync_error        - last sync error message (empty string = no error)
--   zoho_webhook_token     - random secret for authenticating Zoho webhooks
