"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import type { OrderRecord } from "@/types/order";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10;

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Нет идентификатора заказа");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (cancelled) return;
      if (!res.ok) {
        setError("Заказ не найден");
        setLoading(false);
        setPolling(false);
        return;
      }
      const data = (await res.json()) as OrderRecord;
      setOrder(data);
      setLoading(false);
      if (data.status === "paid") {
        setPolling(false);
        clearCart();
        if (intervalId) clearInterval(intervalId);
        return;
      }
      if (data.status === "payment_pending") {
        setPolling(true);
      }
    };

    void fetchOrder();

    intervalId = setInterval(() => {
      if (!orderId || cancelled) return;
      attempts += 1;
      if (attempts > POLL_MAX_ATTEMPTS) {
        setPolling(false);
        if (intervalId) clearInterval(intervalId);
        return;
      }
      fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then((data: OrderRecord) => {
          if (cancelled) return;
          setOrder(data);
          if (data.status === "paid") {
            setPolling(false);
            clearCart();
            if (intervalId) clearInterval(intervalId);
          }
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, clearCart]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#fff8ea] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link
            href="/cart"
            className="inline-block px-6 py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: "#819570" }}
          >
            В корзину
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8ea] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  const amountRub = order ? (order.amount / 100).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-[#fff8ea] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#819570" }}>
          Оплата успешна
        </h1>

        {polling && (
          <p className="text-sm text-muted-foreground mb-4">
            Проверяем статус оплаты…
          </p>
        )}

        {order && order.status === "paid" && (
          <>
            <p className="mb-4">
              Заказ <strong>#{order.id.slice(0, 8)}</strong> оплачен.
            </p>
            <div className="border rounded-lg p-4 bg-white mb-6">
              <h2 className="font-semibold mb-2">Состав заказа</h2>
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                <span>Итого:</span>
                <span>{Number(amountRub).toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Корзина очищена. Мы свяжемся с вами по указанным контактам.
            </p>
          </>
        )}

        {order && order.status === "payment_pending" && !polling && (
          <p className="text-muted-foreground mb-6">
            Статус оплаты ещё обновляется. Обновите страницу через несколько секунд.
          </p>
        )}

        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg font-semibold text-white"
          style={{ backgroundColor: "#819570" }}
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fff8ea] flex items-center justify-center p-4">
        <p className="text-muted-foreground">Загрузка…</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
