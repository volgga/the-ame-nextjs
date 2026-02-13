"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { PaymentContactBlock } from "@/components/payment/ContactBlock";
import type { OrderRecord } from "@/types/order";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10;

type TinkoffStatus = "loading" | "paid" | "failed" | "pending" | null;

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function PackageIcon() {
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
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.93l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.93l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
}

function ClockIcon() {
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
      <path d="M12 6v6l4 2" />
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

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { clearCart, openCartDrawer } = useCart();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tinkoffStatus, setTinkoffStatus] = useState<TinkoffStatus>(null);

  useEffect(() => {
    if (!orderId) return;
    setTinkoffStatus("loading");
    fetch(`/api/tinkoff-status?orderId=${encodeURIComponent(orderId)}`)
      .then((r) => r.json())
      .then((data: { status?: string }) => {
        if (data.status === "paid") setTinkoffStatus("paid");
        else if (data.status === "failed") setTinkoffStatus("failed");
        else setTinkoffStatus("pending");
      })
      .catch(() => setTinkoffStatus(null));
  }, [orderId]);

  // Отправка Telegram-уведомления о успешной оплате (fallback если webhook не сработал)
  useEffect(() => {
    if (!orderId) return;
    console.log("[payment-success] calling notify endpoint", { orderId });
    // Вызываем notify endpoint один раз при загрузке страницы
    fetch("/api/payments/tinkoff/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: "success" }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          console.log("[payment-success] notify endpoint response", data);
        } else {
          console.error("[payment-success] notify endpoint error", { status: res.status, data });
        }
      })
      .catch((err) => {
        console.error("[payment-success] failed to send notification", err);
      });
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Не указан номер заказа. Вернитесь в корзину или на главную.");
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <p className="text-color-text-secondary mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/" className="inline-flex justify-center px-6 py-3 rounded-full font-semibold btn-outline">
              На главную
            </Link>
            <button
              type="button"
              onClick={openCartDrawer}
              className="inline-flex justify-center px-6 py-3 rounded-full font-semibold text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
            >
              В корзину
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-color-text-secondary">Загрузка...</p>
        </div>
      </div>
    );
  }

  // orderId from URL query; amount from API/DB in kopeks (orders.amount) — display as rubles
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
            {/* Левая колонка: растягивается по высоте, контент сверху */}
            <div className="flex flex-col min-w-0 h-full md:pr-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-wrap">
                <div className="flex-shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-btn flex items-center justify-center text-white border border-border-block">
                  <CheckIcon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-[var(--header-bg)] leading-tight">
                    Спасибо за ваш заказ!
                  </h1>
                  <p className="text-color-text-secondary text-sm mt-0.5">Ваш платеж успешно обработан</p>
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
            {/* Правая колонка: растягивается по высоте, 3 блока */}
            <div className="flex flex-col gap-3 md:gap-4 h-full border-t md:border-t-0 md:border-l border-border-block pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-color-text-main flex-shrink-0">
                  <PackageIcon />
                </div>
                <p className="text-color-text-main text-sm md:text-base min-w-0 font-semibold">
                  Мы начали сборку вашего заказа
                </p>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-color-text-main flex-shrink-0">
                  <ClockIcon />
                </div>
                <p className="text-color-text-main text-sm md:text-base min-w-0 font-semibold">
                  Бережно доставим от 60 минут
                </p>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-color-text-main flex-shrink-0">
                  <PhoneIcon />
                </div>
                <p className="text-color-text-main text-sm md:text-base min-w-0 font-semibold">Мы всегда на связи</p>
              </div>
            </div>
          </div>

          {/* Статус оплаты (не блокируем страницу) */}
          {(tinkoffStatus === "loading" || polling) && (
            <p className="text-color-text-secondary text-sm mb-3">Проверяем статус…</p>
          )}

          {/* Нижний блок в 2 колонки: контакты / что дальше — равная высота, разделитель по центру */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 md:gap-0 mb-4 md:mb-5 items-stretch">
            <div className="p-4 md:p-5 pl-0 md:pl-0 md:pr-6 flex flex-col min-h-0">
              <PaymentContactBlock />
            </div>
            <div className="p-4 md:p-5 flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-border-block md:pl-6">
              <h2 className="font-semibold text-color-text-main text-sm mb-2">Что дальше?</h2>
              <ul className="list-disc list-inside text-color-text-secondary text-sm md:text-base space-y-1.5 pl-1">
                <li>Менеджер свяжется с Вами для подтверждения заказа</li>
                <li>Флорист аккуратно соберёт Ваш заказ</li>
                <li>По готовности отправим фото и видео Вашего заказа</li>
                <li>Аккуратно упакуем и бережно доставим</li>
                <li>Сообщим Вам, когда заказ будет доставлен</li>
              </ul>
            </div>
          </div>

          {/* Кнопки: grid 2 равные колонки, одинаковые ширины кнопок — визуально по центру */}
          <div className="flex justify-center">
            <div className="w-full max-w-[520px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 place-content-center">
              <Link
                href="/magazin"
                className="w-full min-w-[200px] sm:min-w-0 inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active transition-colors"
              >
                Продолжить покупки
              </Link>
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

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <p className="text-color-text-secondary">Загрузка…</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
