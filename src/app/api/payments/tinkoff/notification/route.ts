/**
 * POST /api/payments/tinkoff/notification — callback от Tinkoff.
 * Проверяем подпись, по OrderId обновляем статус заказа.
 * Ответ: тело "OK" (без тегов, заглавными), HTTP 200.
 */

import { NextResponse } from "next/server";
import { verifyTinkoffNotificationToken } from "@/lib/tinkoff";
import { getOrderById, updateOrderStatus } from "@/services/orders";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const password = process.env.TINKOFF_PASSWORD;
    if (!password) {
      return new NextResponse("OK", { status: 200 });
    }

    const valid = verifyTinkoffNotificationToken(payload, password);
    if (!valid) {
      return new NextResponse("OK", { status: 200 });
    }

    const orderId = payload.OrderId as string | undefined;
    const status = payload.Status as string | undefined;
    const success = payload.Success === true || payload.Success === "true";

    if (!orderId) {
      return new NextResponse("OK", { status: 200 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return new NextResponse("OK", { status: 200 });
    }

    if (status === "CONFIRMED" || (status === "AUTHORIZED" && success)) {
      await updateOrderStatus(orderId, "paid");
    } else if (status === "CANCELED" || status === "DEADLINE_EXPIRED" || status === "REJECTED" || !success) {
      await updateOrderStatus(orderId, order.status === "payment_pending" ? "failed" : "canceled");
    }
  } catch {
    // Не возвращаем ошибку — Tinkoff ожидает 200 OK
  }

  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
