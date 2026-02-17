import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSessionToken, getAdminCookieName } from "@/lib/adminAuthMiddleware";

const LOGIN_PATH = "/admin/login";

/** Главная страница каталога (все товары) */
const CATALOG_HOME = "/magazin";
/** Страница "Все цветы" (отдельная) */
const ALL_FLOWERS = "/posmotret-vse-tsvety";
/** Маршрут категории */
const MAGAZINE_PREFIX = "/magazine";

const CANONICAL_HOST = "theame.ru";

export async function middleware(request: NextRequest) {
  const { pathname, hostname, protocol, searchParams } = request.nextUrl;

  // /api/* и /_next/* не трогаем — запрос идёт сразу в route/статику
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // ============================================================
  // Canonical host: www → non-www, http → https (301)
  // Только для продакшн-домена, локальную разработку не трогаем.
  // ============================================================
  if (hostname === "www." + CANONICAL_HOST) {
    const url = new URL(request.url);
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }
  if (hostname === CANONICAL_HOST && protocol === "http:") {
    const url = new URL(request.url);
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  // ============================================================
  // Нормализация trailing slash: убираем trailing slash (кроме корня)
  // ============================================================
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = new URL(request.url);
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  // ============================================================
  // Удаление маркетинговых параметров (UTM, gclid, fbclid, yclid и т.д.)
  // Редирект на canonical URL без этих параметров
  // ============================================================
  const marketingParams = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "yclid",
    "ref",
    "source",
  ];
  const hasMarketingParams = marketingParams.some((param) => searchParams.has(param));
  if (hasMarketingParams) {
    const url = new URL(request.url);
    marketingParams.forEach((param) => url.searchParams.delete(param));
    return NextResponse.redirect(url, 301);
  }

  // ============================================================
  // Редиректы на новый формат /magazine/<slug> и главную каталога /magazin
  // ============================================================

  if (pathname === "/catalog") {
    const categoryParam = request.nextUrl.searchParams.get("category");
    if (categoryParam) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${categoryParam}`, request.url), 308);
    }
    return NextResponse.redirect(new URL(CATALOG_HOME, request.url), 308);
  }

  if (pathname.startsWith("/catalog/")) {
    const slug = pathname.slice("/catalog/".length);
    if (slug) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${slug}`, request.url), 308);
    }
  }

  if (pathname === ALL_FLOWERS) {
    const categoryParam = request.nextUrl.searchParams.get("category");
    if (categoryParam) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${categoryParam}`, request.url), 308);
    }
  }

  if (pathname.startsWith(ALL_FLOWERS + "/")) {
    const slug = pathname.slice((ALL_FLOWERS + "/").length);
    if (slug) {
      return NextResponse.redirect(new URL(`${MAGAZINE_PREFIX}/${slug}`, request.url), 308);
    }
  }

  if (pathname.startsWith("/magazin/")) {
    return NextResponse.redirect(new URL(CATALOG_HOME, request.url), 308);
  }

  if (pathname === "/cart" || pathname === "/korzina") {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  // ============================================================
  // Админка: защита (исключения: /admin/login, /api/admin/login, /api/admin/logout)
  // При любой ошибке проверки сессии — редирект на логин, чтобы не ронять процесс (VPS).
  // ============================================================
  if (pathname.startsWith("/admin")) {
    try {
      if (pathname === LOGIN_PATH) {
        const token = request.cookies.get(getAdminCookieName())?.value;
        if (await validateSessionToken(token)) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.next();
      }
      if (pathname === "/admin") {
        return NextResponse.redirect(new URL("/admin/slides", request.url));
      }
      const token = request.cookies.get(getAdminCookieName())?.value;
      if (!(await validateSessionToken(token))) {
        return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
      }
      return NextResponse.next();
    } catch (_err) {
      // Ошибка проверки сессии (jose, env) — не ломаем весь сервер, отправляем на логин
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Запускаем для всех путей (canonical редиректы + роутинг ниже). Исключаем статику.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)$).*)"],
};
