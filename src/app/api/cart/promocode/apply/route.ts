import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePromoCode, isPromoValidNow, computePromoDiscount } from "@/lib/promoCode";
import { z } from "zod";

const CART_PROMO_COOKIE = "cart_promo_code";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

const bodySchema = z.object({
  code: z.string().min(1, "Введите промокод"),
  subtotal: z.number().min(0),
});

/**
 * POST /api/cart/promocode/apply
 * Применяет промокод: проверяет в БД, ставит cookie, возвращает скидку и итоги.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Неверные данные";
      return NextResponse.json({ error: msg, details: parsed.error.flatten() }, { status: 400 });
    }
    const { code: rawCode, subtotal } = parsed.data;
    const code = normalizePromoCode(rawCode);

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from("promo_codes")
      .select("id, code, name, discount_type, value, is_active, starts_at, ends_at")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("[cart/promocode/apply] Supabase error:", error);
      return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: "Промокод не найден" }, { status: 400 });
    }
    if (!row.is_active) {
      return NextResponse.json({ error: "Промокод не активен" }, { status: 400 });
    }
    if (!isPromoValidNow(row)) {
      return NextResponse.json({ error: "Истёк срок действия промокода" }, { status: 400 });
    }

    const { discount, total } = computePromoDiscount(subtotal, row.discount_type, Number(row.value));

    const cookieStore = await cookies();
    cookieStore.set(CART_PROMO_COOKIE, code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

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
    console.error("[cart/promocode/apply]", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
