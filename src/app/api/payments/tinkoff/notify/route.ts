/**
 * POST /api/payments/tinkoff/notify — отправка Telegram-уведомления о результате оплаты.
 * Вызывается со страниц success/fail как fallback, если webhook не сработал.
 * Идемпотентный: проверяет, отправляли ли уже уведомление для этого статуса.
 *
 * Body: { orderId: string, status: "success" | "fail" }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, markPaymentNotificationSent } from "@/services/orders";
import { sendOrderTelegramMessage } from "@/lib/telegram";
import { formatPaymentSuccess, formatPaymentFailed } from "@/lib/telegramOrdersFormat";
import { tinkoffGetState } from "@/lib/tinkoff";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["success", "fail"]),
});

const TBANK_SUCCESS_STATUSES = new Set(["CONFIRMED", "AUTHORIZED"]);
const TBANK_FAIL_STATUSES = new Set(["CANCELED", "REJECTED", "DEADLINE_EXPIRED", "REFUNDED"]);

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные параметры: нужны orderId (UUID) и status (success|fail)" }, { status: 400 });
    }

    const { orderId, status } = parsed.data;

    console.info(`[tbank-notify] received request`, { orderId, status });

    const order = await getOrderById(orderId);
    if (!order) {
      console.warn(`[tbank-notify] order not found: ${orderId}`);
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    // Проверяем реальный статус платежа у T-Bank для защиты от подделки
    let actualPaymentStatus: string | null = null;
    const paymentId = order.tinkoffPaymentId ?? order.paymentId;
    if (paymentId) {
      try {
        const state = await tinkoffGetState(paymentId);
        if (!("error" in state)) {
          actualPaymentStatus = state.Status;
          const isActuallyPaid = TBANK_SUCCESS_STATUSES.has(actualPaymentStatus);
          const isActuallyFailed = TBANK_FAIL_STATUSES.has(actualPaymentStatus);

          // Если статус не совпадает с запрошенным - корректируем
          if (status === "success" && !isActuallyPaid) {
            console.warn(`[tbank-notify] status mismatch: requested success but payment status is ${actualPaymentStatus}`, { orderId, paymentId });
            // Не отправляем уведомление об успехе, если платеж не подтвержден
            return NextResponse.json({ error: "Платеж не подтвержден" }, { status: 400 });
          }
          if (status === "fail" && !isActuallyFailed && !isActuallyPaid) {
            // Для fail более мягкая проверка - может быть pending
            console.log(`[tbank-notify] payment status is ${actualPaymentStatus}, allowing fail notification`, { orderId, paymentId });
          }
        }
      } catch (err) {
        console.warn(`[tbank-notify] failed to check payment status from T-Bank`, {
          orderId,
          paymentId,
          error: err instanceof Error ? err.message : String(err),
        });
        // Продолжаем без проверки статуса - полагаемся на статус заказа в БД
      }
    }

    // Проверяем статус заказа в БД
    const orderStatusMatches =
      (status === "success" && order.status === "paid") ||
      (status === "fail" && (order.status === "failed" || order.status === "canceled"));

    if (!orderStatusMatches && actualPaymentStatus === null) {
      console.warn(`[tbank-notify] order status mismatch: requested ${status} but order.status is ${order.status}`, { orderId });
      // Не блокируем - возможно webhook еще не обновил статус
    }

    // Идемпотентность: проверяем, отправляли ли уже уведомление
    const eventType = status === "success" ? "SUCCESS" : "FAIL";
    const shouldSend = await markPaymentNotificationSent(orderId, eventType);

    if (!shouldSend) {
      console.log(`[tbank-notify] notification already sent for ${status}, skipping`, { orderId });
      return NextResponse.json({ message: "Уведомление уже отправлено" }, { status: 200 });
    }

    // Отправляем уведомление
    try {
      if (status === "success") {
        const message = formatPaymentSuccess(order, paymentId ?? undefined);
        console.info(`[tbank-notify] sending payment success notification`, {
          orderId,
          paymentId: paymentId ?? "none",
          messageLength: message.length,
        });
        await sendOrderTelegramMessage(message);
        console.info(`[tbank-notify] payment success notification sent successfully`, { orderId });
      } else {
        const reason = actualPaymentStatus ?? "Отмена/ошибка оплаты";
        const message = formatPaymentFailed(order, reason);
        console.info(`[tbank-notify] sending payment failed notification`, {
          orderId,
          reason,
          messageLength: message.length,
        });
        await sendOrderTelegramMessage(message);
        console.info(`[tbank-notify] payment failed notification sent successfully`, { orderId });
      }

      return NextResponse.json({ message: "Уведомление отправлено" }, { status: 200 });
    } catch (err) {
      console.error(`[tbank-notify] telegram error`, {
        orderId,
        status,
        error: err instanceof Error ? err.message : String(err),
      });
      // Возвращаем ошибку, но не критичную - страница все равно покажется пользователю
      return NextResponse.json(
        { error: "Не удалось отправить уведомление", details: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[tbank-notify] unexpected error", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
