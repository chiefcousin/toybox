-- Migration: 005_analytics_functions
-- Creates RPC functions for admin analytics dashboard

-- Drop and recreate to allow updates
DROP FUNCTION IF EXISTS get_product_sales_analytics(INT);

CREATE OR REPLACE FUNCTION get_product_sales_analytics(days_back INT DEFAULT 30)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  views BIGINT,
  clicks BIGINT,
  fulfilled BIGINT,
  revenue NUMERIC
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    COUNT(DISTINCT pv.id) AS views,
    COUNT(DISTINCT wo.id) FILTER (WHERE wo.status != 'cancelled') AS clicks,
    COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'fulfilled') AS fulfilled,
    COALESCE(SUM(wo.price * wo.quantity) FILTER (WHERE wo.status = 'fulfilled'), 0) AS revenue
  FROM products p
  LEFT JOIN product_views pv ON pv.product_id = p.id
    AND pv.viewed_at >= NOW() - (days_back || ' days')::INTERVAL
  LEFT JOIN whatsapp_orders wo ON wo.product_id = p.id
    AND wo.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY p.id, p.name
  ORDER BY fulfilled DESC, clicks DESC, views DESC
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION get_product_sales_analytics(INT) TO authenticated, service_role;

-- Function: count returning customers (phones with more than 1 order)
DROP FUNCTION IF EXISTS get_returning_customers_count();

CREATE OR REPLACE FUNCTION get_returning_customers_count()
RETURNS BIGINT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM (
    SELECT customer_phone
    FROM whatsapp_orders
    WHERE customer_phone IS NOT NULL
    GROUP BY customer_phone
    HAVING COUNT(*) > 1
  ) AS returning_customers
$$;

GRANT EXECUTE ON FUNCTION get_returning_customers_count() TO authenticated, service_role;
