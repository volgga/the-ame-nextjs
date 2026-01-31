import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSessionToken, getAdminCookieName } from "@/lib/adminAuth";

const LOGIN_PATH = "/admin/login";
const API_LOGIN = "/api/admin/login";

/** Новый каталог всех товаров */
const ALL_CATALOG = "/posmotret-vse-tsvety";
/** Новый маршрут категории */
const MAGAZINE_PREFIX = "/magazine";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ============================================================
  // Редиректы на новый формат /magazine/<slug>
  // ============================================================

  // /catalog?category=<slug> → /magazine/<slug>
  if (pathname === "/catalog") {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${categoryParam}`, request.url), 308);
    }
    // /catalog без параметра → /posmotret-vse-tsvety
    return NextResponse.redirect(new URL(ALL_CATALOG, request.url), 308);
  }

  // /catalog/<slug> → /magazine/<slug>
  if (pathname.startsWith("/catalog/")) {
    const slug = pathname.slice("/catalog/".length);
    if (slug) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${slug}`, request.url), 308);
    }
  }

  // /posmotret-vse-tsvety?category=<slug> → /magazine/<slug>
  if (pathname === ALL_CATALOG) {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${categoryParam}`, request.url), 308);
    }
  }

  // /posmotret-vse-tsvety/<slug> → /magazine/<slug>
  if (pathname.startsWith(ALL_CATALOG + "/")) {
    const slug = pathname.slice((ALL_CATALOG + "/").length);
    if (slug) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${slug}`, request.url), 308);
    }
  }

  // ============================================================
  // Страницы админки
  // ============================================================
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

  // ============================================================
  // API админки (кроме login)
  // ============================================================
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
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/catalog",
    "/catalog/:path*",
    "/posmotret-vse-tsvety",
    "/posmotret-vse-tsvety/:path*",
  ],
};
