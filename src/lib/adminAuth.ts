/**
 * Админ-авторизация: проверка логина/пароля (bcrypt), установка/чтение session cookie.
 * Пароль только через bcrypt.compare с hash из env. Cookie: httpOnly, sameSite=lax,
 * secure в prod, без maxAge/expires — session cookie (исчезает при закрытии браузера).
 */

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "@/lib/adminSession";

const COOKIE_NAME = "admin_session";

/** Проверка токена по подписи (для использования вне cookies, например в middleware). */
export async function validateSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const payload = await verifySessionToken(token, secret);
  return payload !== null;
}

/**
 * Проверка логина и пароля.
 * 1) Если заданы ADMIN_USERNAME и ADMIN_PASSWORD_HASH — проверка через bcrypt.
 * 2) Иначе если задан ADMIN_PASSWORD_PLAIN (для восстановления доступа) — сравнение в открытую.
 *    После входа замените на хеш: ADMIN_PASSWORD_PLAIN=yourpass node scripts/hash-admin-password.mjs
 */
export async function verifyAdminCredentials(login: string, password: string): Promise<boolean> {
  const username = (process.env.ADMIN_USERNAME ?? "").trim();
  const hash = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();
  const plain = (process.env.ADMIN_PASSWORD_PLAIN ?? "").trim();
  if (typeof login !== "string" || typeof password !== "string") return false;
  if (!username || login !== username) return false;

  if (hash && hash.startsWith("$2")) {
    return bcrypt.compare(password, hash);
  }
  if (plain) {
    return password === plain;
  }
  return false;
}

export async function createAdminSession(): Promise<void> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  const token = await createSessionToken(secret);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Без maxAge/expires — session cookie, удаляется при закрытии браузера
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return validateSessionToken(token);
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}
