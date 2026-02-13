/**
 * GET /api/payments/tinkoff/notify/check?orderId=... — диагностика уведомлений о платежах.
 * Проверяет ENV переменные, статус заказа, флаги уведомлений.
 */

import { NextResponse } from "next/server";
import { getOrderById } from "@/services/orders";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // Проверка ENV переменных
  const envCheck = {
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_ORDERS_CHAT_ID: !!process.env.TELEGRAM_ORDERS_CHAT_ID,
    TELEGRAM_ORDERS_THREAD_ID: !!process.env.TELEGRAM_ORDERS_THREAD_ID,
    TINKOFF_TERMINAL_KEY: !!process.env.TINKOFF_TERMINAL_KEY,
    TINKOFF_PASSWORD: !!process.env.TINKOFF_PASSWORD,
  };
  diagnostics.env = envCheck;
  diagnostics.envAllSet = Object.values(envCheck).every(Boolean);

  // Проверка заказа если orderId передан
  if (orderId) {
    try {
      const order = await getOrderById(orderId);
      if (order) {
        diagnostics.order = {
          id: order.id,
          status: order.status,
          tinkoffPaymentId: order.tinkoffPaymentId,
          paymentId: order.paymentId,
          amount: order.amount,
        };

        // Проверка флагов уведомлений
        const supabase = getSupabaseServer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: orderRow } = await (supabase as any)
          .from("orders")
          .select("payment_success_notified_at, payment_fail_notified_at")
          .eq("id", orderId)
          .single();

        diagnostics.notificationFlags = {
          payment_success_notified_at: orderRow?.payment_success_notified_at ?? null,
          payment_fail_notified_at: orderRow?.payment_fail_notified_at ?? null,
        };

        // Рекомендации
        const recommendations: string[] = [];
        if (!envCheck.TELEGRAM_BOT_TOKEN) {
          recommendations.push("TELEGRAM_BOT_TOKEN не задан на проде");
        }
        if (!envCheck.TELEGRAM_ORDERS_CHAT_ID) {
          recommendations.push("TELEGRAM_ORDERS_CHAT_ID не задан на проде");
        }
        if (order.status !== "paid" && order.status !== "failed") {
          recommendations.push(`Заказ имеет статус "${order.status}" вместо "paid" или "failed"`);
        }
        if (!order.tinkoffPaymentId && !order.paymentId) {
          recommendations.push("У заказа нет paymentId - возможно платеж не был инициализирован");
        }
        if (orderRow?.payment_success_notified_at && order.status === "paid") {
          recommendations.push("Флаг уведомления установлен - уведомление уже отправлялось");
        }

        diagnostics.recommendations = recommendations;
      } else {
        diagnostics.order = { error: "Заказ не найден" };
      }
    } catch (err) {
      diagnostics.order = {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
