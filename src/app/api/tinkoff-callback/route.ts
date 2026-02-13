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
  } catch (err) {
    console.warn("[tinkoff-callback] invalid JSON", err instanceof Error ? err.message : err);
    return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  const orderId = payload.OrderId as string | undefined;
  const status = payload.Status as string | undefined;
  const success = payload.Success === true || payload.Success === "true";
  const paymentId = payload.PaymentId as string | undefined;

  console.log("[tinkoff-callback] received webhook", {
    orderId,
    status,
    success,
    paymentId,
    hasPassword: !!process.env.TINKOFF_PASSWORD,
    hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
    hasTelegramChatId: !!process.env.TELEGRAM_ORDERS_CHAT_ID,
  });

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
            const finalPaymentId = paymentId ?? order.tinkoffPaymentId ?? order.paymentId ?? undefined;
            const message = formatPaymentSuccess(order, finalPaymentId);
            console.log(`[tinkoff-callback] sending payment success tg`, {
              orderId,
              paymentId: finalPaymentId,
              messageLength: message.length,
              hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
              hasTelegramChatId: !!process.env.TELEGRAM_ORDERS_CHAT_ID,
            });
            await sendOrderTelegramMessage(message);
            console.log(`[tinkoff-callback] payment success tg sent successfully`, { orderId });
          } catch (err) {
            console.error(
              "[tinkoff-callback] payment success tg failed",
              {
                orderId,
                error: err instanceof Error ? err.message : String(err),
              }
            );
          }
        } else {
          console.log(`[tinkoff-callback] payment success notification already sent, skipping`, { orderId });
        }
      } else if (status === "CANCELED" || status === "DEADLINE_EXPIRED" || status === "REJECTED" || !success) {
        console.log(`[tinkoff-callback] payment failed detected`, {
          orderId,
          status,
          success,
          paymentId: payload.PaymentId,
          currentOrderStatus: order.status,
        });
        const newStatus = order.status === "payment_pending" ? "failed" : "canceled";
        await updateOrderStatus(orderId, newStatus);
        // Идемпотентность: проверяем, отправляли ли уже уведомление о неуспешной оплате
        const shouldSend = await markPaymentNotificationSent(orderId, "FAIL");
        console.log(`[tinkoff-callback] shouldSend=${shouldSend} for orderId=${orderId} (FAIL)`);
        if (shouldSend) {
          try {
            const reason =
              (payload.Message as string | undefined) ??
              (payload.ErrorCode != null ? String(payload.ErrorCode) : undefined) ??
              status;
            console.log(`[tinkoff-callback] sending payment failed tg`, {
              orderId,
              reason,
              hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
              hasTelegramChatId: !!process.env.TELEGRAM_ORDERS_CHAT_ID,
            });
            await sendOrderTelegramMessage(formatPaymentFailed(order, reason));
            console.log(`[tinkoff-callback] payment failed tg sent successfully`, { orderId });
          } catch (err) {
            console.error(
              "[tinkoff-callback] payment failed tg failed",
              {
                orderId,
                error: err instanceof Error ? err.message : String(err),
              }
            );
          }
        } else {
          console.log(`[tinkoff-callback] payment failed notification already sent, skipping`, { orderId });
        }
      } else {
        // Логируем неизвестные статусы для отладки
        console.log(`[tinkoff-callback] payment status not handled as success/fail`, {
          orderId,
          status,
          success,
          paymentId,
        });
      }
    } else {
      console.warn(`[tinkoff-callback] order not found`, { orderId });
    }
  } else {
    console.warn(`[tinkoff-callback] no orderId in payload`, { payloadKeys: Object.keys(payload) });
  }

  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
