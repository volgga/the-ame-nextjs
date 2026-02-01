"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments/tinkoff/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-color-text-main">Оплата не прошла</h1>
        <p className="text-muted-foreground mb-6">
          Платёж не был завершён. Вы можете попробовать оплатить снова или вернуться в корзину.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="px-6 py-3 rounded-full font-semibold text-white disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
            >
              {loading ? "Загрузка…" : "Попробовать снова"}
            </button>
          )}
          <Link href="/cart" className="inline-block px-6 py-3 rounded-full font-semibold btn-outline">
            В корзину
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page-bg flex items-center justify-center p-4">
          <p className="text-muted-foreground">Загрузка…</p>
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
