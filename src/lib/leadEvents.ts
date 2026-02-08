/**
 * Утилиты для записи событий аудита форм.
 * Best effort подход: если запись события упала, не фейлим основной запрос.
 */

import { getSupabaseAdmin } from "./supabaseAdmin";

export type LeadEventType =
  | "received"
  | "saved"
  | "tg_sent"
  | "tg_failed"
  | "saved_failed"
  | "rate_limited"
  | "honeypot";

export interface LeadEventMeta {
  formType?: string;
  ip?: string;
  userAgent?: string;
  pageUrl?: string;
  phone?: string; // Можно, но только для аудита
  error?: string;
  [key: string]: unknown;
}

/**
 * Записывает событие в таблицу lead_events.
 * Best effort: если запись упала, не выбрасывает ошибку.
 *
 * @param type - Тип события
 * @param meta - Метаданные события (без секретов)
 * @param leadId - Опциональный ID лида
 */
export async function logLeadEvent(
  type: LeadEventType,
  meta: LeadEventMeta = {},
  leadId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("lead_events").insert({
      lead_id: leadId || null,
      type,
      meta,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[leadEvents] event=${type} not written: ${msg}`);
  }
}

/**
 * Извлекает IP адрес из Request.
 */
export function getIPFromRequest(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[0];
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return undefined;
}

/**
 * Извлекает User-Agent из Request.
 */
export function getUserAgentFromRequest(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}
