/**
 * POST /api/payments/tinkoff/init — инициализация платежа Tinkoff.
 * Тело: { orderId }. Заказ должен существовать; сумма берётся из заказа (копейки).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, updateOrderStatus } from "@/services/orders";
import { tinkoffInit } from "@/lib/tinkoff";

const bodySchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверный orderId" }, { status: 400 });
    }

    const order = await getOrderById(parsed.data.orderId);
    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ error: "Заказ уже оплачен" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const successUrl = process.env.TINKOFF_SUCCESS_URL ?? `${siteUrl}/payment/success`;
    const failUrl = process.env.TINKOFF_FAIL_URL ?? `${siteUrl}/payment/fail`;
    const notificationUrl = process.env.TINKOFF_NOTIFICATION_URL ?? "";

    const initResult = await tinkoffInit({
      Amount: order.amount,
      OrderId: order.id,
      Description: `Оплата заказа #${order.id.slice(0, 8)}`,
      SuccessURL: successUrl,
      FailURL: failUrl,
      NotificationURL: notificationUrl || undefined,
    });

    if ("error" in initResult) {
      return NextResponse.json({ error: initResult.error }, { status: 502 });
    }

    await updateOrderStatus(order.id, "payment_pending", initResult.PaymentId);

    return NextResponse.json({
      paymentUrl: initResult.PaymentURL,
      orderId: order.id,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка инициализации платежа" }, { status: 500 });
  }
}
