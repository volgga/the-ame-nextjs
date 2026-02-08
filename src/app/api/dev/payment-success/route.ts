/**
 * DEV-ONLY: эмуляция успешной оплаты для локальной проверки Telegram-уведомлений.
 * Вызывает те же функции, что и webhook Tinkoff (formatPaymentSuccess + sendOrderTelegramMessage).
 * Доступен только при NODE_ENV=development.
 *
 * POST /api/dev/payment-success
 * Body: { "orderId": "<uuid существующего заказа>" }
 */

import { NextResponse } from "next/server";
import { getOrderById } from "@/services/orders";
import { sendOrderTelegramMessage } from "@/lib/telegram";
import { formatPaymentSuccess } from "@/lib/telegramOrdersFormat";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body: { orderId?: string };
  try {
    body = (await request.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "JSON body with orderId required" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  console.log("[dev/payment-success] sending payment success tg, orderId:", orderId);
  try {
    const paymentId = order.tinkoffPaymentId ?? order.paymentId ?? undefined;
    const text = formatPaymentSuccess(order, paymentId);
    await sendOrderTelegramMessage(text);
    return NextResponse.json({ ok: true, message: "Уведомление «Оплата успешна» отправлено" });
  } catch (err) {
    console.error("[dev/payment-success] payment tg failed", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Ошибка отправки в Telegram", details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
