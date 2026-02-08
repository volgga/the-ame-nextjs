"use client";

import { useState } from "react";
import { normalizePromoCode } from "@/lib/promoCode";

export type PromoTotals = {
  subtotal: number;
  discount: number;
  total: number;
  promo: { code: string; name: string; discountType: string; value: number } | null;
};

type PromoCodeBlockProps = {
  subtotal: number;
  totals: PromoTotals;
  onApplySuccess: (newTotals: PromoTotals) => void;
  onRemoveSuccess: () => void;
  variant?: "cart" | "checkout";
};

export function PromoCodeBlock({
  subtotal,
  totals,
  onApplySuccess,
  onRemoveSuccess,
  variant = "cart",
}: PromoCodeBlockProps) {
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const promoLabel =
    totals.promo &&
    (totals.promo.discountType === "PERCENT"
      ? `-${totals.promo.value}%`
      : `-${totals.promo.value.toLocaleString("ru-RU")} ₽`);

  const handleApplyPromo = async () => {
    const code = normalizePromoCode(promoInput);
    if (!code) {
      setPromoError("Введите промокод");
      return;
    }
    setPromoError("");
    setApplyLoading(true);
    try {
      const res = await fetch("/api/cart/promocode/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (res.ok) {
        onApplySuccess({
          subtotal: data.subtotal,
          discount: data.discount,
          total: data.total,
          promo: data.promo,
        });
        setPromoInput(data.promo?.code ?? code);
      } else {
        setPromoError(data.error ?? "Промокод не найден");
      }
    } catch {
      setPromoError("Ошибка применения промокода");
    } finally {
      setApplyLoading(false);
    }
  };

  const handleRemovePromo = async () => {
    setPromoError("");
    setRemoveLoading(true);
    try {
      await fetch("/api/cart/promocode/remove", { method: "POST" });
      onRemoveSuccess();
      setPromoInput("");
    } finally {
      setRemoveLoading(false);
    }
  };

  const isCheckout = variant === "checkout";

  return (
    <div className={isCheckout ? "space-y-2" : "mt-4 space-y-2"}>
      <label className={isCheckout ? "block text-base font-semibold mb-2 text-color-text-main" : "block text-sm font-medium text-[#111]"}>
        Промокод
      </label>
      {totals.promo ? (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              isCheckout
                ? "rounded bg-green-50 px-2 py-1 text-sm text-green-800"
                : "rounded bg-green-50 px-2 py-1 text-sm text-green-800"
            }
          >
            Промокод применён: {promoLabel}
          </span>
          <button
            type="button"
            onClick={handleRemovePromo}
            disabled={removeLoading}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {removeLoading ? "…" : "Снять"}
          </button>
        </div>
      ) : (
        <div className={isCheckout ? "flex gap-2 flex-wrap" : "flex flex-wrap gap-2"}>
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            onBlur={() => setPromoInput((s) => normalizePromoCode(s))}
            placeholder={isCheckout ? "Введите код" : "Введите код"}
            className={
              isCheckout
                ? "flex-1 min-w-[120px] px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase placeholder:normal-case"
                : "flex-1 min-w-[120px] rounded border border-gray-300 px-3 py-2 text-sm uppercase placeholder:normal-case"
            }
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={applyLoading}
            className={
              isCheckout
                ? "px-4 py-3 min-h-[44px] rounded-lg font-medium text-white bg-accent-btn hover:bg-accent-btn-hover disabled:opacity-50 shrink-0"
                : "rounded px-4 py-2 text-sm font-medium text-white bg-accent-btn hover:bg-accent-btn-hover disabled:opacity-50"
            }
          >
            {applyLoading ? "Проверка…" : "Применить"}
          </button>
        </div>
      )}
      {promoError && <p className="text-sm text-red-600">{promoError}</p>}
    </div>
  );
}
