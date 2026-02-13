/**
 * POST /api/payments/tinkoff/init — инициализация платежа Tinkoff.
 * Тело: { orderId }. Заказ должен существовать; сумма берётся из заказа (копейки).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, updateOrderStatus } from "@/services/orders";
import { getServerBaseUrl } from "@/lib/base-url";
import { tinkoffInit } from "@/lib/tinkoff";

const bodySchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверный orderId" }, { status: 400 });
    }

    const order = await getOrderById(parsed.data.orderId);
    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ error: "Заказ уже оплачен" }, { status: 400 });
    }

    const baseUrl = getServerBaseUrl();
    const baseSuccess = process.env.TINKOFF_SUCCESS_URL ?? `${baseUrl}/payment/success`;
    const baseFail = process.env.TINKOFF_FAIL_URL ?? `${baseUrl}/payment/fail`;
    const sep = (u: string) => (u.includes("?") ? "&" : "?");
    const successUrl = `${baseSuccess}${sep(baseSuccess)}orderId=${order.id}`;
    const failUrl = `${baseFail}${sep(baseFail)}orderId=${order.id}`;
    if (!successUrl.startsWith("http") || !failUrl.startsWith("http")) {
      return NextResponse.json(
        {
          error:
            "Задайте NEXT_PUBLIC_SITE_URL или TINKOFF_SUCCESS_URL/TINKOFF_FAIL_URL (абсолютные URL) для редиректа после оплаты.",
        },
        { status: 502 }
      );
    }
    const notificationUrl = process.env.TINKOFF_NOTIFICATION_URL ?? "";

    const c = order.customer ?? {};
    const data: Record<string, string> = {};
    if (c.deliveryAddress) data.Address = c.deliveryAddress;
    if (c.deliveryDate) data.Date = c.deliveryDate;
    if (c.deliveryTime) data.Time = c.deliveryTime;
    if (c.name) data.CustomerName = c.name;
    if (c.phone) data.Phone = c.phone;

    const initResult = await tinkoffInit({
      Amount: Math.round(order.amount),
      OrderId: order.id,
      Description: `Оплата заказа #${order.id.slice(0, 8)}`,
      SuccessURL: successUrl,
      FailURL: failUrl,
      NotificationURL: notificationUrl || undefined,
      Data: Object.keys(data).length > 0 ? data : undefined,
    });

    if ("error" in initResult) {
      const details = initResult.details as { ErrorCode?: string; Details?: string } | undefined;
      console.warn("[tinkoff-init] Init failed", {
        orderId: order.id,
        errorCode: details?.ErrorCode,
        details: details?.Details,
      });
      return NextResponse.json(
        { error: initResult.error ?? "Неверные параметры" },
        { status: 502 }
      );
    }

    await updateOrderStatus(order.id, "payment_pending", initResult.PaymentId);

    return NextResponse.json({
      paymentUrl: initResult.PaymentURL,
      orderId: order.id,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка инициализации платежа" }, { status: 500 });
  }
}
