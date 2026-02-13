/**
 * POST /api/tinkoff-callback — уведомление от T-Bank (URL настроен в кабинете: https://theame.ru/api/tinkoff-callback).
 * Логируем входящие данные; проверяем подпись и обновляем статус заказа.
 * Структура данных сохраняется такой, чтобы позже легко отправить в Telegram-бот.
 * Ответ: "OK", HTTP 200.
 */

import { NextResponse } from "next/server";
import { verifyTinkoffNotificationToken } from "@/lib/tinkoff";
import { getOrderById, updateOrderStatus, markPaymentNotificationSent } from "@/services/orders";
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

  console.log("[tinkoff-callback] received webhook", {
    orderId: payload.OrderId,
    status: payload.Status,
    success: payload.Success,
    paymentId: payload.PaymentId,
    hasPassword: !!process.env.TINKOFF_PASSWORD,
  });

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
        console.log(`[tinkoff-callback] payment success detected`, {
          orderId,
          status,
          success,
          paymentId: payload.PaymentId,
        });
        await updateOrderStatus(orderId, "paid");
        // Идемпотентность: проверяем, отправляли ли уже уведомление об успешной оплате
        const shouldSend = await markPaymentNotificationSent(orderId, "SUCCESS");
        console.log(`[tinkoff-callback] shouldSend=${shouldSend} for orderId=${orderId}`);
        if (shouldSend) {
          try {
            const paymentId = (payload.PaymentId ?? order.tinkoffPaymentId ?? order.paymentId) as string | undefined;
            const message = formatPaymentSuccess(order, paymentId);
            console.log(`[tinkoff-callback] sending payment success tg, orderId=${orderId}, messageLength=${message.length}`);
            await sendOrderTelegramMessage(message);
            console.log(`[tinkoff-callback] payment success tg sent successfully, orderId=${orderId}`);
          } catch (err) {
            console.error(
              "[tinkoff-callback] payment success tg failed orderId=" + orderId,
              err instanceof Error ? err.message : err
            );
          }
        } else {
          console.log(`[tinkoff-callback] payment success notification already sent, skipping orderId=${orderId}`);
        }
      } else if (status === "CANCELED" || status === "DEADLINE_EXPIRED" || status === "REJECTED" || !success) {
        const newStatus = order.status === "payment_pending" ? "failed" : "canceled";
        await updateOrderStatus(orderId, newStatus);
        // Идемпотентность: проверяем, отправляли ли уже уведомление о неуспешной оплате
        const shouldSend = await markPaymentNotificationSent(orderId, "FAIL");
        if (shouldSend) {
          try {
            const reason =
              (payload.Message as string | undefined) ??
              (payload.ErrorCode != null ? String(payload.ErrorCode) : undefined) ??
              status;
            await sendOrderTelegramMessage(formatPaymentFailed(order, reason));
          } catch (err) {
            console.error(
              "[tinkoff-callback] payment failed tg failed orderId=" + orderId,
              err instanceof Error ? err.message : err
            );
          }
        } else {
          console.log(`[tinkoff-callback] payment failed notification already sent, skipping orderId=${orderId}`);
        }
      }
    }
  }

  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
