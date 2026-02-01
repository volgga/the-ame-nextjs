/**
 * POST /api/orders/quick — быстрый заказ "Купить в один клик".
 * Создаёт заказ со статусом "quick_order" для обратного звонка.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const bodySchema = z.object({
  productId: z.string().min(1),
  productTitle: z.string().min(1),
  productPrice: z.number().min(0),
  customerName: z.string().optional().default(""),
  customerPhone: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }

    const { productId, productTitle, productPrice, customerName, customerPhone } = parsed.data;

    const supabase = getSupabaseAdmin();
    // Таблица orders не в сгенерированных типах Supabase — приведение типа
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("orders")
      .insert({
        status: "quick_order",
        amount: productPrice,
        items: [{ id: productId, title: productTitle, price: productPrice, quantity: 1 }],
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_data: {
          type: "quick_order",
          productId,
          productTitle,
          productPrice,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[quick-order] Ошибка создания заказа:", error.message);
      return NextResponse.json({ error: "Ошибка создания заказа" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
    });
  } catch (err) {
    console.error("[quick-order] Исключение:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
