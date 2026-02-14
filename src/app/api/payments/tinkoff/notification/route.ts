/**
 * POST /api/payments/tinkoff/notification — callback от Tinkoff.
 * Проверяем подпись, по OrderId обновляем статус заказа.
 * Ответ: тело "OK" (без тегов, заглавными), HTTP 200.
 */

import { NextResponse } from "next/server";
import { verifyTinkoffNotificationToken } from "@/lib/tinkoff";
import { getOrderById, updateOrderStatus, markPaymentNotificationSent } from "@/services/orders";
import { sendOrderTelegramMessage } from "@/lib/telegram";
import { formatPaymentSuccess, formatPaymentFailed } from "@/lib/telegramOrdersFormat";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    
    const orderId = payload.OrderId as string | undefined;
    const status = payload.Status as string | undefined;
    const success = payload.Success === true || payload.Success === "true";
    const paymentId = payload.PaymentId as string | undefined;

    const password = process.env.TINKOFF_PASSWORD;
    if (!password) {
      console.warn("[tinkoff-notification] TINKOFF_PASSWORD not set, skipping verification", { orderId });
      return new NextResponse("OK", { status: 200 });
    }

    const valid = verifyTinkoffNotificationToken(payload, password);
    if (!valid) {
      console.warn("[tinkoff-notification] invalid token, rejecting", { orderId, status });
      return new NextResponse("OK", { status: 200 });
    }

    if (!orderId) {
      console.warn("[tinkoff-notification] no orderId in payload");
      return new NextResponse("OK", { status: 200 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      console.warn(`[tinkoff-notification] order not found: ${orderId}`);
      return new NextResponse("OK", { status: 200 });
    }

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
          const message = formatPaymentSuccess(order, finalPaymentId);
          await sendOrderTelegramMessage(message);
        } catch (err) {
          console.error(
            "[tinkoff-notification] payment success tg failed",
            {
              orderId,
              error: err instanceof Error ? err.message : String(err),
            }
          );
        }
      }
    } else if (status === "CANCELED" || status === "DEADLINE_EXPIRED" || status === "REJECTED" || (!success && status)) {
      await updateOrderStatus(orderId, order.status === "payment_pending" ? "failed" : "canceled");
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
            "[tinkoff-notification] payment failed tg failed",
            {
              orderId,
              error: err instanceof Error ? err.message : String(err),
            }
          );
        }
      }
    }
  } catch (err) {
    console.error("[tinkoff-notification] unexpected error", err instanceof Error ? err.message : err);
    // Не возвращаем ошибку — Tinkoff ожидает 200 OK
  }

  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
