"use client";

import { useEffect } from "react";

export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => {
      // fire-and-forget
    });
  }, [productId]);

  return null;
}
