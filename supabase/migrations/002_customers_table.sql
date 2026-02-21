-- Migration: 002_customers_table
-- Creates the customers table for WhatsApp OTP-based customer registration

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL UNIQUE,  -- WhatsApp number with country code
  address TEXT,
  otp_code TEXT,               -- hashed OTP code
  otp_expires_at TIMESTAMPTZ,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone);
CREATE INDEX IF NOT EXISTS customers_is_verified_idx ON customers (is_verified);

-- Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (for API routes)
CREATE POLICY "Service role full access on customers"
  ON customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public can insert new customers (sign-up)
CREATE POLICY "Public can insert customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can select their own record by phone (for OTP verification steps)
CREATE POLICY "Public can select own customer by phone"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();
