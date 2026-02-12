"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/whatsapp";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import type { WhatsAppOrder } from "@/lib/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<WhatsAppOrder[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const supabase = createClient();

  async function fetchOrders() {
    let query = supabase
      .from("whatsapp_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setOrders((data as WhatsAppOrder[]) || []);
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from("whatsapp_orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Order status changed to ${status}` });
      fetchOrders();
    }
  }

  async function updateNotes(orderId: string, notes: string) {
    await supabase
      .from("whatsapp_orders")
      .update({ admin_notes: notes })
      .eq("id", orderId);
  }

  const statusColors: Record<string, string> = {
    clicked: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    fulfilled: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">WhatsApp Orders</h1>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        {ORDER_STATUSES.map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}{" "}
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {order.product_name}
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.price)}</td>
                  <td className="px-4 py-3">{order.quantity}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value as OrderStatus)
                      }
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[order.status]
                      }`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      defaultValue={order.admin_notes || ""}
                      placeholder="Add note..."
                      className="h-8 text-xs"
                      onBlur={(e) => updateNotes(order.id, e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(order.price * order.quantity)}
                    </span>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
