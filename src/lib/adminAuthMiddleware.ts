/**
 * Проверка admin-сессии в Edge (middleware).
 * Простой токен: base64url(JSON.stringify({ admin, exp })).
 */

const COOKIE_NAME = "admin_session";

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

function base64UrlDecodeToStr(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(arr);
}

/** Проверяет простой session-токен (payload с admin и exp). */
export function validateSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const json = base64UrlDecodeToStr(token);
    const data = JSON.parse(json);
    return Boolean(data?.admin && data?.exp && typeof data.exp === "number" && data.exp > Date.now());
  } catch {
    return false;
  }
}
