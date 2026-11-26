import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  let isVerifiedAdmin = false;
  if (!error && user) {
    const email = String(user.email || "").trim().toLowerCase();
    const { data: byUser } = await supabase
      .from("admin_profiles")
      .select("aktif")
      .eq("user_id", user.id)
      .maybeSingle();

    if (byUser) {
      isVerifiedAdmin = Boolean(byUser.aktif);
    } else if (email) {
      const { data: byEmail } = await supabase
        .from("admin_profiles")
        .select("aktif")
        .eq("email", email)
        .maybeSingle();
      isVerifiedAdmin = Boolean(byEmail?.aktif);
    }
  }

  if (!isVerifiedAdmin && !isLoginPage) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isVerifiedAdmin && isLoginPage) {
    const adminUrl = new URL("/admin", request.url);
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
