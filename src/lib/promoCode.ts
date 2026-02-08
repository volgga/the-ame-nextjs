/**
 * Нормализация кода промокода (trim + uppercase для кириллицы/латиницы).
 * Использовать в admin create/update и в cart apply.
 */
export function normalizePromoCode(code: string): string {
  return code.trim().toLocaleUpperCase("ru-RU");
}

/** Безопасная сериализация для JSON (BigInt → string). */
export function toJsonString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "bigint") return String(v);
  if (typeof v === "string") return v;
  if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  return String(v);
}

/** Дата в ISO или null для JSON. */
export function toJsonDate(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  return null;
}

/** Строка промокода из БД в DTO для NextResponse.json (без BigInt). */
export function serializePromoRow(row: Record<string, unknown>) {
  const rawType = row.discount_type;
  const discountType = rawType === "FIXED" ? "FIXED" : "PERCENT";
  return {
    id: toJsonString(row.id),
    code: row.code != null ? String(row.code) : "",
    name: row.name != null ? String(row.name) : "",
    discountType,
    value: Number(row.value) || 0,
    isActive: Boolean(row.is_active),
    startsAt: toJsonDate(row.starts_at),
    endsAt: toJsonDate(row.ends_at),
    createdAt: toJsonDate(row.created_at) ?? "",
    updatedAt: toJsonDate(row.updated_at) ?? "",
  };
}

export type PromoRow = {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export function isPromoValidNow(row: PromoRow, now: Date = new Date()): boolean {
  if (!row.is_active) return false;
  if (row.starts_at) {
    const start = new Date(row.starts_at);
    if (Number.isNaN(start.getTime()) || now < start) return false;
  }
  if (row.ends_at) {
    const end = new Date(row.ends_at);
    if (Number.isNaN(end.getTime()) || now > end) return false;
  }
  return true;
}

/**
 * Рассчитать скидку и итог по промокоду и сумме корзины.
 * PERCENT: discount = subtotal * (value/100), FIXED: discount = value.
 * total = max(0, subtotal - discount).
 */
export function computePromoDiscount(
  subtotal: number,
  discountType: string,
  value: number
): { discount: number; total: number } {
  let discount = 0;
  if (discountType === "PERCENT") {
    discount = Math.round((subtotal * value) / 100);
  } else {
    discount = Math.min(value, subtotal);
  }
  const total = Math.max(0, Math.round(subtotal - discount));
  return { discount, total };
}
