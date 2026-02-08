/**
 * POST /api/tinkoff-callback — уведомление от T-Bank (URL настроен в кабинете: https://theame.ru/api/tinkoff-callback).
 * Логируем входящие данные; проверяем подпись и обновляем статус заказа.
 * Структура данных сохраняется такой, чтобы позже легко отправить в Telegram-бот.
 * Ответ: "OK", HTTP 200.
 */

import { NextResponse } from "next/server";
import { verifyTinkoffNotificationToken } from "@/lib/tinkoff";
import { getOrderById, updateOrderStatus } from "@/services/orders";
import { sendOrderTelegramMessage } from "@/lib/telegram";
import { formatPaymentSuccess, formatPaymentFailed } from "@/lib/telegramOrdersFormat";

export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
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
      if (status === "CONFIRMED" || (status === "AUTHORIZED" && success)) {
        await updateOrderStatus(orderId, "paid");
        try {
          const paymentId = (payload.PaymentId ?? order.tinkoffPaymentId ?? order.paymentId) as string | undefined;
          await sendOrderTelegramMessage(formatPaymentSuccess(order, paymentId));
        } catch (err) {
          console.error("[tinkoff-callback] payment success tg failed orderId=" + orderId, err instanceof Error ? err.message : err);
        }
      } else if (
        status === "CANCELED" ||
        status === "DEADLINE_EXPIRED" ||
        status === "REJECTED" ||
        !success
      ) {
        const newStatus = order.status === "payment_pending" ? "failed" : "canceled";
        await updateOrderStatus(orderId, newStatus);
        try {
          const reason =
            (payload.Message as string | undefined) ??
            (payload.ErrorCode != null ? String(payload.ErrorCode) : undefined) ??
            status;
          await sendOrderTelegramMessage(formatPaymentFailed(order, reason));
        } catch (err) {
          console.error("[tinkoff-callback] payment failed tg failed orderId=" + orderId, err instanceof Error ? err.message : err);
        }
      }
    }
  }

  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
