"use client";

import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // User cancelled or not supported
      }
    }

    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Link Copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      )}
    </Button>
  );
}
