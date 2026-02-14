/**
 * DEV-ONLY: эмуляция неуспешной оплаты для локальной проверки Telegram-уведомлений.
 * Вызывает те же функции, что и webhook Tinkoff (formatPaymentFailed + sendOrderTelegramMessage).
 * Доступен только при NODE_ENV=development.
 *
 * POST /api/dev/payment-failed
 * Body: { "orderId": "<uuid>", "reason"?: "REJECTED / причина" }
 */

import { NextResponse } from "next/server";
import { getOrderById } from "@/services/orders";
import { sendOrderTelegramMessage } from "@/lib/telegram";
import { formatPaymentFailed } from "@/lib/telegramOrdersFormat";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body: { orderId?: string; reason?: string };
  try {
    body = (await request.json()) as { orderId?: string; reason?: string };
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

  const reason = body.reason?.trim() ?? "REJECTED (dev test)";
  try {
    const text = formatPaymentFailed(order, reason);
    await sendOrderTelegramMessage(text);
    return NextResponse.json({ ok: true, message: "Уведомление «Оплата не прошла» отправлено" });
  } catch (err) {
    console.error("[dev/payment-failed] payment tg failed", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Ошибка отправки в Telegram", details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
