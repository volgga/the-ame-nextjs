/**
 * POST /api/payments/tinkoff/notify — отправка Telegram-уведомления о результате оплаты.
 * Вызывается со страниц success/fail как fallback, если webhook не сработал.
 * Идемпотентный: проверяет, отправляли ли уже уведомление для этого статуса.
 *
 * Body: { orderId: string, status: "success" | "fail" }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, markPaymentNotificationSent, updateOrderStatus } from "@/services/orders";
import { sendOrderTelegramMessage } from "@/lib/telegram";
import { formatPaymentSuccess, formatPaymentFailed } from "@/lib/telegramOrdersFormat";
import { tinkoffGetState } from "@/lib/tinkoff";
import { getSupabaseServer } from "@/lib/supabaseServer";

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

    // Проверяем статус заказа в БД
    const orderStatusMatches =
      (status === "success" && order.status === "paid") ||
      (status === "fail" && (order.status === "failed" || order.status === "canceled"));

    console.info(`[tbank-notify] order status check`, {
      orderId,
      requestedStatus: status,
      orderStatus: order.status,
      matches: orderStatusMatches,
    });

    // Если статус не совпадает - проверяем реальный статус у T-Bank и обновляем заказ
    let actualPaymentStatus: string | null = null;
    const paymentId = order.tinkoffPaymentId ?? order.paymentId;
    
    if (!orderStatusMatches && paymentId) {
      // Статус в БД не совпадает - проверяем у T-Bank и обновляем БД
      try {
        const state = await tinkoffGetState(paymentId);
        if (!("error" in state)) {
          actualPaymentStatus = state.Status;
          const isActuallyPaid = TBANK_SUCCESS_STATUSES.has(actualPaymentStatus);
          const isActuallyFailed = TBANK_FAIL_STATUSES.has(actualPaymentStatus);

          console.info(`[tbank-notify] T-Bank status check`, {
            orderId,
            paymentId,
            tbankStatus: actualPaymentStatus,
            isPaid: isActuallyPaid,
            isFailed: isActuallyFailed,
            currentOrderStatus: order.status,
          });

          // Обновляем статус заказа в БД на основе реального статуса T-Bank
          if (status === "success" && isActuallyPaid && order.status !== "paid") {
            await updateOrderStatus(orderId, "paid");
            order.status = "paid"; // Обновляем локальную копию
          } else if (status === "fail" && isActuallyFailed && order.status !== "failed" && order.status !== "canceled") {
            await updateOrderStatus(orderId, "failed");
            order.status = "failed"; // Обновляем локальную копию
          } else if (status === "success" && !isActuallyPaid) {
            // Платеж еще не подтвержден - блокируем отправку уведомления об успехе
            console.warn(`[tbank-notify] blocking success notification: payment not confirmed by T-Bank`, {
              orderId,
              paymentId,
              orderStatus: order.status,
              tbankStatus: actualPaymentStatus,
            });
            return NextResponse.json({ error: "Платеж не подтвержден" }, { status: 400 });
          }
        }
      } catch (err) {
        console.warn(`[tbank-notify] failed to check payment status from T-Bank`, {
          orderId,
          paymentId,
          error: err instanceof Error ? err.message : String(err),
        });
        // Если не удалось проверить статус и заказ не помечен как paid - блокируем для success
        if (status === "success" && order.status !== "paid") {
          console.warn(`[tbank-notify] blocking success notification: cannot verify payment status`, { orderId });
          return NextResponse.json({ error: "Не удалось подтвердить статус платежа" }, { status: 400 });
        }
      }
    } else if (!orderStatusMatches && !paymentId) {
      // Нет paymentId и статус не совпадает - не можем проверить, блокируем для success
      if (status === "success") {
        console.warn(`[tbank-notify] blocking success notification: no paymentId and order not paid`, {
          orderId,
          orderStatus: order.status,
        });
        return NextResponse.json({ error: "Платеж не подтвержден" }, { status: 400 });
      }
      // Для fail более мягкая проверка
      console.warn(`[tbank-notify] no paymentId found, proceeding with fail notification`, { orderId, orderStatus: order.status });
    }

    // Идемпотентность: проверяем, отправляли ли уже уведомление
    const eventType = status === "success" ? "SUCCESS" : "FAIL";
    
    // Проверяем текущее значение флага перед попыткой установить
    const supabase = getSupabaseServer();
    const fieldName = eventType === "SUCCESS" ? "payment_success_notified_at" : "payment_fail_notified_at";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentOrder } = await (supabase as any)
      .from("orders")
      .select(fieldName)
      .eq("id", orderId)
      .single();
    
    const alreadyNotified = currentOrder?.[fieldName] != null;
    
    console.info(`[tbank-notify] idempotency check`, {
      orderId,
      eventType,
      fieldName,
      alreadyNotified,
      currentValue: currentOrder?.[fieldName],
    });

    // Пытаемся установить флаг атомарно
    const shouldSend = await markPaymentNotificationSent(orderId, eventType);

    console.info(`[tbank-notify] markPaymentNotificationSent result`, {
      orderId,
      eventType,
      shouldSend,
      alreadyNotified,
    });

    if (!shouldSend && alreadyNotified) {
      return NextResponse.json({ message: "Уведомление уже отправлено" }, { status: 200 });
    }
    
    // Если shouldSend = false, но флаг не был установлен - возможно ошибка БД
    // В этом случае все равно попробуем отправить уведомление
    if (!shouldSend && !alreadyNotified) {
      console.warn(`[tbank-notify] markPaymentNotificationSent returned false but flag was not set, proceeding anyway`, {
        orderId,
        eventType,
      });
    }

    // Отправляем уведомление
    try {
      // Проверяем наличие ENV переменных перед отправкой
      const hasTelegramToken = !!process.env.TELEGRAM_BOT_TOKEN;
      const hasTelegramChatId = !!process.env.TELEGRAM_ORDERS_CHAT_ID;

      console.info(`[tbank-notify] telegram env check`, {
        orderId,
        hasTelegramToken,
        hasTelegramChatId,
      });

      // Fallback: если TELEGRAM_ORDERS_CHAT_ID не задан, пробуем TELEGRAM_CHAT_ID
      const fallbackChatId = process.env.TELEGRAM_ORDERS_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
      const finalChatId = fallbackChatId?.trim();
      
      if (!hasTelegramToken || !finalChatId) {
        const missing = [];
        if (!hasTelegramToken) missing.push("TELEGRAM_BOT_TOKEN");
        if (!finalChatId) missing.push("TELEGRAM_ORDERS_CHAT_ID или TELEGRAM_CHAT_ID");
        console.error(`[tbank-notify] missing telegram env variables`, { 
          orderId, 
          missing,
          hasTelegramToken,
          hasTelegramChatId,
          hasFallbackChatId: !!process.env.TELEGRAM_CHAT_ID,
        });
        return NextResponse.json(
          { error: "Telegram не настроен", details: `Отсутствуют переменные: ${missing.join(", ")}` },
          { status: 500 }
        );
      }
      
      // Используем fallback chatId если основной не задан
      if (!process.env.TELEGRAM_ORDERS_CHAT_ID && process.env.TELEGRAM_CHAT_ID) {
        console.warn(`[tbank-notify] using TELEGRAM_CHAT_ID as fallback for TELEGRAM_ORDERS_CHAT_ID`, { orderId });
      }

      if (status === "success") {
        const message = formatPaymentSuccess(order, paymentId ?? undefined);
        console.info(`[tbank-notify] sending payment success notification`, {
          orderId,
          paymentId: paymentId ?? "none",
          messageLength: message.length,
          hasTelegramToken,
          hasTelegramChatId,
          telegramChatId: process.env.TELEGRAM_ORDERS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "not set",
          telegramThreadId: process.env.TELEGRAM_ORDERS_THREAD_ID || process.env.TELEGRAM_THREAD_ID || "not set",
        });
        try {
          await sendOrderTelegramMessage(message);
          console.info(`[tbank-notify] payment success notification sent successfully`, { orderId });
        } catch (telegramErr) {
          // Детальная ошибка от Telegram API
          console.error(`[tbank-notify] sendOrderTelegramMessage failed`, {
            orderId,
            error: telegramErr instanceof Error ? telegramErr.message : String(telegramErr),
            errorStack: telegramErr instanceof Error ? telegramErr.stack : undefined,
          });
          throw telegramErr; // Пробрасываем дальше для общего catch
        }
      } else {
        const reason = actualPaymentStatus ?? "Отмена/ошибка оплаты";
        const message = formatPaymentFailed(order, reason);
        console.info(`[tbank-notify] sending payment failed notification`, {
          orderId,
          reason,
          messageLength: message.length,
          hasTelegramToken,
          hasTelegramChatId,
          telegramChatId: process.env.TELEGRAM_ORDERS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "not set",
          telegramThreadId: process.env.TELEGRAM_ORDERS_THREAD_ID || process.env.TELEGRAM_THREAD_ID || "not set",
        });
        try {
          await sendOrderTelegramMessage(message);
          console.info(`[tbank-notify] payment failed notification sent successfully`, { orderId });
        } catch (telegramErr) {
          // Детальная ошибка от Telegram API
          console.error(`[tbank-notify] sendOrderTelegramMessage failed`, {
            orderId,
            error: telegramErr instanceof Error ? telegramErr.message : String(telegramErr),
            errorStack: telegramErr instanceof Error ? telegramErr.stack : undefined,
          });
          throw telegramErr; // Пробрасываем дальше для общего catch
        }
      }

      return NextResponse.json({ message: "Уведомление отправлено" }, { status: 200 });
    } catch (err) {
      console.error(`[tbank-notify] telegram error`, {
        orderId,
        status,
        error: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
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
