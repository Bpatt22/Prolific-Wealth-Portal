import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-aware client for use in Server Components / Route Handlers.
// Respects RLS as the logged-in user (uses the anon key + the user's cookies).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component with no request context to write to — safe to ignore
            // because the middleware refreshes the session cookie on every request anyway.
          }
        },
      },
    }
  );
}
