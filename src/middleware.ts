import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSessionToken, getAdminCookieName } from "@/lib/adminAuth";

const LOGIN_PATH = "/admin/login";
const API_LOGIN = "/api/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Страницы админки
  if (pathname.startsWith("/admin")) {
    if (pathname === LOGIN_PATH) {
      const token = request.cookies.get(getAdminCookieName())?.value;
      if (validateSessionToken(token)) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }
    const token = request.cookies.get(getAdminCookieName())?.value;
    if (!validateSessionToken(token)) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
    return NextResponse.next();
  }

  // API админки (кроме login)
  if (pathname.startsWith("/api/admin") && pathname !== API_LOGIN) {
    const token = request.cookies.get(getAdminCookieName())?.value;
    if (!validateSessionToken(token)) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
