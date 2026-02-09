/**
 * POST /api/orders — создание заказа из корзины.
 * Тело: { items: [{ id, quantity }], customer: { ... } }.
 * Сумма пересчитывается на сервере по каталогу. Учитывается применённый промокод из cookie.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createOrder } from "@/services/orders";
import { sendOrderTelegramMessage } from "@/lib/telegram";
import { formatOrderPlaced } from "@/lib/telegramOrdersFormat";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePromoCode, isPromoValidNow, computePromoDiscount } from "@/lib/promoCode";

const CART_PROMO_COOKIE = "cart_promo_code";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  customer: z.record(z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }

    const cookieStore = await cookies();
    const codeFromCookie = cookieStore.get(CART_PROMO_COOKIE)?.value?.trim();
    const getPromoDiscountRubles = async (subtotalRubles: number): Promise<number> => {
      if (!codeFromCookie) return 0;
      const code = normalizePromoCode(codeFromCookie);
      const supabase = getSupabaseAdmin();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: row } = await (supabase as any)
        .from("promo_codes")
        .select("id, code, discount_type, value, is_active, starts_at, ends_at")
        .eq("code", code)
        .maybeSingle();
      if (!row || !isPromoValidNow(row)) return 0;
      const { discount } = computePromoDiscount(subtotalRubles, row.discount_type, Number(row.value));
      return discount;
    };

    const result = await createOrder({
      items: parsed.data.items,
      customer: (parsed.data.customer ?? {}) as Parameters<typeof createOrder>[0]["customer"],
      getPromoDiscountRubles,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    try {
      const text = formatOrderPlaced(result.order);
      await sendOrderTelegramMessage(text);
    } catch (err) {
      console.error(
        "[orders] order created tg failed orderId=" + result.order.id,
        err instanceof Error ? err.message : err
      );
    }

    return NextResponse.json({
      orderId: result.order.id,
      amount: result.order.amount,
      status: result.order.status,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка создания заказа" }, { status: 500 });
  }
}
