/**
 * Админ-авторизация: проверка пароля, установка/чтение cookie сессии.
 * Пароль берётся из ADMIN_PASSWORD (env). Cookie: httpOnly, secure в prod.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

/** Подписанный токен (простой base64 для минимальной реализации; в prod лучше JWT). */
function createSessionToken(): string {
  const payload = { admin: true, exp: Date.now() + COOKIE_MAX_AGE * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/** Проверка токена (для middleware — без cookies()). */
export function validateSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const data = JSON.parse(json);
    return Boolean(data?.admin && data?.exp && data.exp > Date.now());
  } catch {
    return false;
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export async function createAdminSession(): Promise<string> {
  const token = createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return token;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return validateSessionToken(token);
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}
