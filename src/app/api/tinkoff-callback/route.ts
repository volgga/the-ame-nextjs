/**
 * POST /api/tinkoff-callback — уведомление от T-Bank (URL настроен в кабинете: https://theame.ru/api/tinkoff-callback).
 * Логируем входящие данные; проверяем подпись и обновляем статус заказа.
 * Структура данных сохраняется такой, чтобы позже легко отправить в Telegram-бот.
 * Ответ: "OK", HTTP 200.
 */

import { NextResponse } from "next/server";
import { verifyTinkoffNotificationToken } from "@/lib/tinkoff";
import { getOrderById, updateOrderStatus, markPaymentNotificationSent } from "@/services/orders";
import { sendTelegramAlert } from "@/utils/telegramAlert";
import { formatPaymentSuccess, formatPaymentFailed } from "@/lib/telegramOrdersFormat";

export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
    console.log("Tinkoff Webhook Payload:", payload);
  } catch (err) {
    console.warn("[tinkoff-callback] invalid JSON", err instanceof Error ? err.message : err);
    return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  const orderId = payload.OrderId != null ? String(payload.OrderId) : undefined;
  const status = payload.Status != null ? String(payload.Status) : undefined;
  const success = payload.Success === true || payload.Success === "true";
  const paymentId = payload.PaymentId != null ? String(payload.PaymentId) : undefined;

  const password = process.env.TINKOFF_PASSWORD;
  if (password) {
    const valid = verifyTinkoffNotificationToken(payload, password);
    if (!valid) {
      console.warn("[tinkoff-callback] invalid token", { orderId, status });
      return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
  } else {
    console.warn("[tinkoff-callback] TINKOFF_PASSWORD not set, skipping verification", { orderId });
  }

  if (orderId) {
    const order = await getOrderById(orderId);
    if (order) {
      // Проверка успешной оплаты: CONFIRMED, AUTHORIZED, или success=true (fallback)
      const isPaymentSuccess =
        status === "CONFIRMED" ||
        status === "AUTHORIZED" ||
        (success === true && status !== "CANCELED" && status !== "REJECTED" && status !== "DEADLINE_EXPIRED");

      if (isPaymentSuccess) {
        await updateOrderStatus(orderId, "paid");
        const shouldSend = await markPaymentNotificationSent(orderId, "SUCCESS");
        if (shouldSend) {
          try {
            const finalPaymentId = paymentId ?? order.tinkoffPaymentId ?? order.paymentId ?? undefined;
            await sendTelegramAlert(formatPaymentSuccess(order, finalPaymentId));
          } catch (err) {
            console.error(
              "[tinkoff-callback] payment success tg failed",
              {
                orderId,
                error: err instanceof Error ? err.message : String(err),
              }
            );
          }
        }
      } else if (status === "CANCELED" || status === "DEADLINE_EXPIRED" || status === "REJECTED" || !success) {
        const newStatus = order.status === "payment_pending" ? "failed" : "canceled";
        await updateOrderStatus(orderId, newStatus);
        const shouldSend = await markPaymentNotificationSent(orderId, "FAIL");
        if (shouldSend) {
          try {
            const reason =
              (payload.Message as string | undefined) ??
              (payload.ErrorCode != null ? String(payload.ErrorCode) : undefined) ??
              status;
            await sendTelegramAlert(formatPaymentFailed(order, reason));
          } catch (err) {
            console.error(
              "[tinkoff-callback] payment failed tg failed",
              {
                orderId,
                error: err instanceof Error ? err.message : String(err),
              }
            );
          }
        }
      }
    } else {
      console.warn(`[tinkoff-callback] order not found`, { orderId });
    }
  } else {
    console.warn(`[tinkoff-callback] no orderId in payload`, { payloadKeys: Object.keys(payload) });
  }

  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
