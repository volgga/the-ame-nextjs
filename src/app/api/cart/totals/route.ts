import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePromoCode, isPromoValidNow, computePromoDiscount } from "@/lib/promoCode";
import { z } from "zod";

const CART_PROMO_COOKIE = "cart_promo_code";

const bodySchema = z.object({
  subtotal: z.number().min(0),
});

/**
 * POST /api/cart/totals
 * Body: { subtotal }
 * Возвращает итоги с учётом применённого промокода из cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const { subtotal } = parsed.data;

    const cookieStore = await cookies();
    const codeFromCookie = cookieStore.get(CART_PROMO_COOKIE)?.value?.trim();
    if (!codeFromCookie) {
      return NextResponse.json({ subtotal, discount: 0, total: subtotal, promo: null });
    }

    const code = normalizePromoCode(codeFromCookie);
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from("promo_codes")
      .select("id, code, name, discount_type, value, is_active, starts_at, ends_at")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("[cart/totals] Supabase error:", error);
      return NextResponse.json({ subtotal, discount: 0, total: subtotal, promo: null });
    }

    if (!row || !isPromoValidNow(row)) {
      // Промокод не найден или недействителен — не очищаем cookie здесь, только не даём скидку
      return NextResponse.json({ subtotal, discount: 0, total: subtotal, promo: null });
    }

    const { discount, total } = computePromoDiscount(subtotal, row.discount_type, Number(row.value));
    return NextResponse.json({
      subtotal,
      discount,
      total,
      promo: {
        code: row.code,
        name: row.name,
        discountType: row.discount_type,
        value: Number(row.value),
      },
    });
  } catch (e) {
    console.error("[cart/totals]", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
