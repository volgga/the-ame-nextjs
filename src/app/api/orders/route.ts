/**
 * POST /api/orders — создание заказа из корзины.
 * Тело: { items: [{ id, quantity }], customer: { ... } }.
 * Сумма пересчитывается на сервере по каталогу.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/services/orders";

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

    const result = await createOrder({
      items: parsed.data.items,
      customer: (parsed.data.customer ?? {}) as Parameters<typeof createOrder>[0]["customer"],
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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
