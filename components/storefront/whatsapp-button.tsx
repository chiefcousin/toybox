"use client";

import { useState } from "react";
import { MessageCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppButton({
  product,
  whatsappNumber,
  disabled,
}: {
  product: { id: string; name: string; price: number; slug: string };
  whatsappNumber: string;
  disabled?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleOrder() {
    setLoading(true);
    try {
      // Log the order click
      await fetch("/api/whatsapp-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity,
        }),
      });
    } catch {
      // Don't block the WhatsApp redirect on logging failure
    }

    const siteUrl = window.location.origin;
    const url = buildWhatsAppUrl(whatsappNumber, product, quantity, siteUrl);
    window.open(url, "_blank");
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center rounded-md border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-muted"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2rem] text-center text-sm font-medium">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Button
        onClick={handleOrder}
        disabled={disabled || loading}
        className="w-full gap-2 bg-[hsl(142,70%,45%)] text-white hover:bg-[hsl(142,70%,40%)]"
        size="lg"
      >
        <MessageCircle className="h-5 w-5" />
        {loading ? "Opening WhatsApp..." : "Order via WhatsApp"}
      </Button>
    </div>
  );
}
