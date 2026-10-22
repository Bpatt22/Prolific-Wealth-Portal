import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  // /invite carries its session as a URL fragment (or a not-yet-exchanged code) that
  // the server can't see on first load — it must be reachable before any cookie exists
  // so the client-side Supabase auth listener gets a chance to process it.
  const isInvitePage = request.nextUrl.pathname.startsWith("/invite");
  // Segment-exact, not a plain prefix: "/affiliates" is the owner-only admin
  // page for managing affiliates and must NOT match here.
  const isAffiliatePath = request.nextUrl.pathname === "/affiliate" || request.nextUrl.pathname.startsWith("/affiliate/");
  const isPublicApi =
    request.nextUrl.pathname.startsWith("/api/webhooks") ||
    request.nextUrl.pathname.startsWith("/api/admin") ||
    request.nextUrl.pathname.startsWith("/api/backup");

  if (!user && !isLoginPage && !isInvitePage && !isPublicApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Affiliates are a separate, view-only role with no team_members row —
  // route them to /affiliate/* and keep them out of the owner/team portal,
  // and vice versa. Checked via RLS's "read own affiliate row" policy, so
  // this works with the anon-key client already set up above.
  if (user && !isPublicApi) {
    const { data: affiliateRow } = await supabase.from("affiliates").select("id").eq("auth_user_id", user.id).maybeSingle();
    const isAffiliate = !!affiliateRow;
    const homePath = isAffiliate ? "/affiliate" : "/dashboard";

    if (isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = homePath;
      return NextResponse.redirect(url);
    }
    if (!isInvitePage) {
      if (isAffiliate && !isAffiliatePath) {
        const url = request.nextUrl.clone();
        url.pathname = homePath;
        return NextResponse.redirect(url);
      }
      if (!isAffiliate && isAffiliatePath) {
        const url = request.nextUrl.clone();
        url.pathname = homePath;
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
