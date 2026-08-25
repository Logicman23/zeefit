import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Two jobs, in this order of importance:
 *
 *   1. Refresh the Supabase session cookie. @supabase/ssr cannot do this from a
 *      Server Component (they cannot write cookies), so if middleware does not
 *      run, staff get signed out roughly hourly.
 *   2. Redirect anonymous callers to sign-in before a page renders.
 *
 * It is NOT the authorization boundary. Role checks live in lib/auth/guard.ts,
 * next to the data, and run again inside every Server Action.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() (not getSession()) — it revalidates the token and triggers the
  // refresh whose Set-Cookie headers we hand back below.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;
  const isLoginRoute = pathname === "/admin/login";

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("next", pathname + (searchParams.size ? `?${searchParams}` : ""));
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Return this exact object. Building a fresh NextResponse here would drop the
  // refreshed auth cookies and sign people out at seemingly random moments.
  return response;
}

export const config = {
  /**
   * Scoped to /admin deliberately. The storefront is public and largely static,
   * so keeping it out of the matcher leaves those routes on the CDN with zero
   * middleware invocations per request.
   */
  matcher: ["/admin/:path*"],
};
