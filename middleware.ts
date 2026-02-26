import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that staff (view-only) and partner roles can access
const RESTRICTED_ALLOWED = ["/admin", "/admin/orders"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Customer signup gate (storefront routes) ──────────────────────
  if (!pathname.startsWith("/admin")) {
    const hasCustomerCookie = request.cookies.has("ka_customer");

    // Already registered → redirect away from /signup
    if (pathname === "/signup") {
      if (hasCustomerCookie) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    // All other storefront routes require signup
    if (!hasCustomerCookie) {
      return NextResponse.redirect(new URL("/signup", request.url));
    }

    return NextResponse.next();
  }

  // ── Admin route protection (existing logic) ───────────────────────
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Fetch the user's role from user_roles table
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = roleRow?.role;

  // If no role row exists, the user is treated as a full admin
  // (the first admin account created directly in Supabase won't have a role row)
  if (!role || role === "admin") {
    return response;
  }

  // staff and partner: can only access /admin (dashboard) and /admin/orders
  const isAllowed = RESTRICTED_ALLOWED.some(
    (allowed) =>
      pathname === allowed || pathname.startsWith(allowed + "/")
  );

  if (!isAllowed) {
    const ordersUrl = new URL("/admin/orders", request.url);
    return NextResponse.redirect(ordersUrl);
  }

  // Attach role to request headers so pages can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-role", role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/products/:path*",
    "/categories/:path*",
    "/search",
    "/signup",
  ],
};
