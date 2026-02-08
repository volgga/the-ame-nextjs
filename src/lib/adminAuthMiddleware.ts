/**
 * Проверка admin-сессии в Edge (middleware).
 * Подписанный JWT через jose (без Node-зависимостей).
 */

import { verifySessionToken } from "@/lib/adminSession";

const COOKIE_NAME = "admin_session";

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

/** Проверяет подписанный session token. Async — используется в async middleware. */
export async function validateSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const payload = await verifySessionToken(token, secret);
  return payload !== null;
}
