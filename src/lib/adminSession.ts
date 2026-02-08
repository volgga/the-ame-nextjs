/**
 * Подписанный session token для админки (jose JWS).
 * Используется в Node (adminAuth) и Edge (middleware). Без exp — сессия живёт пока есть cookie.
 */

import * as jose from "jose";

const SUB = "admin";
const ALG = "HS256";

export type SessionPayload = { sub: string; iat: number; nonce: string };

/** Создать подписанный JWT (только на сервере). */
export async function createSessionToken(secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  const nonceB64 = Buffer.from(nonce).toString("base64url");
  return await new jose.SignJWT({ nonce: nonceB64 })
    .setProtectedHeader({ alg: ALG })
    .setSubject(SUB)
    .setIssuedAt()
    .sign(key);
}

/** Проверить подпись и вернуть payload или null. Работает в Node и Edge. */
export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key, { algorithms: [ALG] });
    if (payload.sub !== SUB || typeof payload.iat !== "number" || !payload.nonce) return null;
    return { sub: payload.sub as string, iat: payload.iat, nonce: String(payload.nonce) };
  } catch {
    return null;
  }
}
