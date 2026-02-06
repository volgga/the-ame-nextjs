import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSessionToken, getAdminCookieName } from "@/lib/adminAuth";

const LOGIN_PATH = "/admin/login";
const API_LOGIN = "/api/admin/login";

/** Главная страница каталога (все товары) */
const CATALOG_HOME = "/magazin";
/** Страница "Все цветы" (отдельная) */
const ALL_FLOWERS = "/posmotret-vse-tsvety";
/** Маршрут категории */
const MAGAZINE_PREFIX = "/magazine";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ============================================================
  // Редиректы на новый формат /magazine/<slug> и главную каталога /magazin
  // ============================================================

  // /catalog?category=<slug> → /magazine/<slug>
  if (pathname === "/catalog") {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${categoryParam}`, request.url), 308);
    }
    // /catalog без параметра → главная каталога /magazin
    return NextResponse.redirect(new URL(CATALOG_HOME, request.url), 308);
  }

  // /catalog/<slug> → /magazine/<slug>
  if (pathname.startsWith("/catalog/")) {
    const slug = pathname.slice("/catalog/".length);
    if (slug) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${slug}`, request.url), 308);
    }
  }

  // /posmotret-vse-tsvety?category=<slug> → /magazine/<slug>
  if (pathname === ALL_FLOWERS) {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${categoryParam}`, request.url), 308);
    }
  }

  // /posmotret-vse-tsvety/<slug> → /magazine/<slug>
  if (pathname.startsWith(ALL_FLOWERS + "/")) {
    const slug = pathname.slice((ALL_FLOWERS + "/").length);
    if (slug) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${slug}`, request.url), 308);
    }
  }

  // /magazin/katalog и прочие подпути — на главную каталога (основной путь каталога: /magazin)
  if (pathname.startsWith("/magazin/")) {
    return NextResponse.redirect(new URL(CATALOG_HOME, request.url), 308);
  }

  // Корзина — только модалка в шапке; отдельной страницы нет
  if (pathname === "/cart" || pathname === "/korzina") {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  // ============================================================
  // Страницы админки
  // ============================================================
  if (pathname.startsWith("/admin")) {
    if (pathname === LOGIN_PATH) {
      const token = request.cookies.get(getAdminCookieName())?.value;
      if (validateSessionToken(token)) {
        return NextResponse.redirect(new URL("/admin/slides", request.url));
      }
      return NextResponse.next();
    }
    if (pathname === "/admin") {
      return NextResponse.redirect(new URL("/admin/slides", request.url));
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
    "/cart",
    "/korzina",
    "/catalog",
    "/catalog/:path*",
    "/magazin",
    "/magazin/:path*",
    "/posmotret-vse-tsvety",
    "/posmotret-vse-tsvety/:path*",
  ],
};
