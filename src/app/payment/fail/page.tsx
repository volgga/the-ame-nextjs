"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { PaymentContactBlock } from "@/components/payment/ContactBlock";
import type { OrderRecord } from "@/types/order";

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-8 h-8"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const { openCartDrawer } = useCart();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: OrderRecord | null) => setOrder(data ?? null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  // Отправка Telegram-уведомления о неуспешной оплате (fallback если webhook не сработал)
  useEffect(() => {
    if (!orderId) return;
    
    // Защита от повторных вызовов
    let cancelled = false;
    let notified = false;
    
    const sendNotification = async () => {
      if (notified || cancelled) return;
      notified = true;
      
      try {
        const res = await fetch("/api/payments/tinkoff/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: "fail" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("[payment-fail] notify endpoint error", { status: res.status, data });
        }
      } catch (err) {
        console.error("[payment-fail] failed to send notification", err);
      }
    };
    
    // Небольшая задержка чтобы убедиться что компонент полностью загружен
    const timeoutId = setTimeout(sendNotification, 500);
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-4 md:py-6 px-4">
        <p className="text-color-text-secondary">Загрузка…</p>
      </div>
    );
  }

  const orderNumber = orderId ?? (order && typeof order.id === "string" ? order.id : undefined);
  const orderAmount =
    order && typeof order.amount === "number" ? `${(order.amount / 100).toLocaleString("ru-RU")} ₽` : undefined;
  const orderFields: { label: string; value: string }[] = [
    { label: "Номер заказа", value: orderNumber },
    { label: "Сумма заказа", value: orderAmount },
  ].filter((f): f is { label: string; value: string } => f.value != null && f.value !== "");

  return (
    <div className="flex-1 flex flex-col justify-center py-4 md:py-6 px-4">
      <div className="max-w-[1100px] mx-auto w-full">
        <div className="bg-white border border-border-block rounded-2xl p-4 md:p-5 shadow-soft">
          {/* Верх: 2 колонки 50/50, разделитель по центру */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 md:gap-0 mb-4 md:mb-5 items-stretch">
            <div className="flex flex-col min-w-0 h-full md:pr-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-wrap">
                <div className="flex-shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground border border-border-block">
                  <ErrorIcon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-destructive leading-tight">Ошибка платежа</h1>
                  <p className="text-color-text-secondary text-sm mt-0.5">Произошла ошибка при обработке платежа</p>
                </div>
              </div>
              {orderFields.length > 0 && (
                <div className="mt-4 space-y-1">
                  <h2 className="font-semibold text-color-text-main text-sm mb-1.5">Данные заказа</h2>
                  {orderFields.map(({ label, value }) => (
                    <div key={label} className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 text-sm min-w-0">
                      <span className="text-color-text-secondary shrink-0">{label}:</span>
                      <span className="text-color-text-main font-medium break-all">{value}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1 min-h-0" aria-hidden />
            </div>
            <div className="flex flex-col gap-3 md:gap-4 h-full border-t md:border-t-0 md:border-l border-border-block pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-color-text-main flex-shrink-0">
                  <AlertCircleIcon />
                </div>
                <p className="text-color-text-main text-sm md:text-base min-w-0 font-semibold">Платёж не прошёл</p>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-color-text-main flex-shrink-0">
                  <RefreshIcon />
                </div>
                <p className="text-color-text-main text-sm md:text-base min-w-0 font-semibold">Попробуйте ещё раз</p>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-color-text-main flex-shrink-0">
                  <PhoneIcon />
                </div>
                <p className="text-color-text-main text-sm md:text-base min-w-0 font-semibold">
                  Если нужна помощь — мы на связи
                </p>
              </div>
            </div>
          </div>

          {/* Нижний блок: контакты / что делать — разделитель по центру */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 md:gap-0 mb-4 md:mb-5 items-stretch">
            <div className="p-4 md:p-5 pl-0 md:pl-0 md:pr-6 flex flex-col min-h-0">
              <PaymentContactBlock />
            </div>
            <div className="p-4 md:p-5 flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-border-block md:pl-6">
              <h2 className="font-semibold text-color-text-main text-sm mb-2">Что делать?</h2>
              <ul className="list-disc list-inside text-color-text-secondary text-sm md:text-base space-y-1.5 pl-1">
                <li>Проверьте данные карты или баланс и попробуйте ещё раз</li>
                <li>Если списание произошло, но заказ не оформился — напишите нам</li>
                <li>Мы поможем завершить оплату или оформим заказ вручную</li>
              </ul>
            </div>
          </div>

          {/* Кнопки: grid 2 равные колонки, одинаковые ширины кнопок — визуально по центру */}
          <div className="flex justify-center">
            <div className="w-full max-w-[520px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 place-content-center">
              <button
                type="button"
                onClick={openCartDrawer}
                className="w-full min-w-[200px] sm:min-w-0 inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active transition-colors"
              >
                Попробовать снова
              </button>
              <Link
                href="/"
                className="w-full min-w-[200px] sm:min-w-0 inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold btn-outline transition-colors"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-4 md:py-6 px-4">
          <p className="text-color-text-secondary">Загрузка…</p>
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
