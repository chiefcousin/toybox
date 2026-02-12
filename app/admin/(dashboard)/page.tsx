import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MessageCircle, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface OrderRow {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  status: string;
  created_at: string;
}

interface TopViewedRow {
  product_id: string;
  product_name: string;
  view_count: number;
}

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // Fetch stats in parallel
  const [productsResult, ordersResult, viewsResult, lowStockResult, recentOrdersResult, topViewedResult] =
    await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("whatsapp_orders").select("id", { count: "exact", head: true }),
      supabase.from("product_views").select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .lte("stock_quantity", 5)
        .gt("stock_quantity", 0),
      supabase
        .from("whatsapp_orders")
        .select("id, product_name, price, quantity, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.rpc("get_top_viewed_products", {
        days_back: 30,
        result_limit: 5,
      }),
    ]);

  const stats = [
    {
      label: "Total Products",
      value: productsResult.count || 0,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "WhatsApp Orders",
      value: ordersResult.count || 0,
      icon: MessageCircle,
      href: "/admin/orders",
    },
    {
      label: "Product Views",
      value: viewsResult.count || 0,
      icon: Eye,
      href: "/admin",
    },
    {
      label: "Low Stock",
      value: lowStockResult.count || 0,
      icon: AlertTriangle,
      href: "/admin/inventory",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent WhatsApp Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrdersResult.data?.length ? (
              <div className="space-y-3">
                {recentOrdersResult.data.map((order: OrderRow) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">{order.product_name}</p>
                      <p className="text-muted-foreground">
                        Qty: {order.quantity} &middot;{" "}
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === "fulfilled"
                          ? "bg-green-100 text-green-700"
                          : order.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Viewed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Viewed (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {topViewedResult.data?.length ? (
              <div className="space-y-3">
                {topViewedResult.data.map((item: TopViewedRow) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{item.product_name}</span>
                    <span className="text-muted-foreground">
                      {item.view_count} views
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No view data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
