/**
 * POST /api/tinkoff-callback — уведомление от T-Bank (URL настроен в кабинете: https://theame.ru/api/tinkoff-callback).
 * Логируем входящие данные; проверяем подпись и обновляем статус заказа.
 * Структура данных сохраняется такой, чтобы позже легко отправить в Telegram-бот.
 * Ответ: "OK", HTTP 200.
 */

import { NextResponse } from "next/server";
import { verifyTinkoffNotificationToken } from "@/lib/tinkoff";
import { getOrderById, updateOrderStatus } from "@/services/orders";

export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
    // Логируем сырой входящий запрос (без паролей)
    console.log("[tinkoff-callback] payload:", JSON.stringify(payload, null, 2));
  } catch {
    console.warn("[tinkoff-callback] invalid JSON");
    return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  const password = process.env.TINKOFF_PASSWORD;
  if (password) {
    const valid = verifyTinkoffNotificationToken(payload, password);
    if (!valid) {
      console.warn("[tinkoff-callback] invalid token");
      return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
  }

  const orderId = payload.OrderId as string | undefined;
  const status = payload.Status as string | undefined;
  const success = payload.Success === true || payload.Success === "true";

  if (orderId) {
    const order = await getOrderById(orderId);
    if (order) {
      let newStatus: "paid" | "failed" | "canceled" | undefined;
      if (status === "CONFIRMED" || (status === "AUTHORIZED" && success)) {
        newStatus = "paid";
        await updateOrderStatus(orderId, "paid");
      } else if (
        status === "CANCELED" ||
        status === "DEADLINE_EXPIRED" ||
        status === "REJECTED" ||
        !success
      ) {
        newStatus = order.status === "payment_pending" ? "failed" : "canceled";
        await updateOrderStatus(orderId, newStatus);
      }

      // Структура для будущей отправки в Telegram (пока только логируем)
      const telegramReady = {
        orderId: order.id,
        status: newStatus ?? order.status,
        amount: order.amount,
        customer: order.customer,
        items: order.items,
        paymentStatus: status,
        success,
      };
      console.log("[tinkoff-callback] telegramReady:", JSON.stringify(telegramReady, null, 2));
    }
  }

  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
