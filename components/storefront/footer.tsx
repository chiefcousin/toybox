import { Package } from "lucide-react";
import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="border-t bg-muted/40 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-semibold">Kaira Enterprises</span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/products" className="hover:text-foreground">
              All Toys
            </Link>
            <Link href="/products?is_featured=true" className="hover:text-foreground">
              Featured
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Kaira Enterprises. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
