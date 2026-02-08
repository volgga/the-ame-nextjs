"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import { submitOneClick } from "@/lib/formsClient";

export type QuickBuyProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
};

type QuickBuyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: QuickBuyProduct;
};

const Z_OVERLAY = 200;
const Z_PANEL = 201;

/** Проверка телефона: минимум 7–10 цифр */
function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * QuickBuyModal — модалка «Купить в 1 клик».
 * Закрытие: крестик, backdrop, Escape.
 */
export function QuickBuyModal({ isOpen, onClose, product }: QuickBuyModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setSubmitError(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setPhoneError("Укажите номер телефона");
      return;
    }
    if (!isValidPhone(trimmedPhone)) {
      setPhoneError("Введите корректный номер (7–15 цифр)");
      return;
    }

    setLoading(true);
    try {
      const pageUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      const payload = {
        phone: trimmedPhone,
        name: name.trim() || undefined,
        productTitle: product.name,
        pageUrl,
        productId: product.id || undefined,
      };
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        console.log("[QuickBuy] payload", payload);
      }

      const data = await submitOneClick(payload);

      if (!data.ok) {
        setSubmitError(data.error ?? "Ошибка при отправке. Попробуйте ещё раз.");
        setLoading(false);
        return;
      }

      setLoading(false);
      if (typeof window !== "undefined") {
        window.alert("Заявка отправлена! Мы свяжемся с вами в течение 5 минут.");
      }
      onClose();
    } catch {
      setSubmitError("Ошибка сети. Проверьте интернет и попробуйте снова.");
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const content = (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: Z_OVERLAY }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        style={{ zIndex: Z_PANEL }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-block">
          <h2 className="text-xl font-semibold text-color-text-main">Купить в 1 клик</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-color-text-secondary hover:text-color-text-main hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {/* Позиция: мини-фото, название, количество, цена */}
          <div className="flex items-center gap-3 p-3 bg-[rgba(31,42,31,0.06)] rounded-xl mb-6">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#ece9e2]">
              <Image
                src={product.image?.trim() && (product.image.startsWith("http") || product.image.startsWith("/")) ? product.image : "/placeholder.svg"}
                alt={product.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-color-text-main line-clamp-2">{product.name}</p>
              <p className="text-xs text-color-text-secondary mt-0.5">1 шт.</p>
            </div>
            <p className="text-sm font-semibold text-color-text-main shrink-0">
              {product.price.toLocaleString("ru-RU")} ₽
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="quick-buy-phone" className="block text-sm font-medium text-color-text-main mb-1">
                Ваш телефон <span className="text-red-500">*</span>
              </label>
              <input
                id="quick-buy-phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError(null);
                }}
                className={`w-full px-4 py-3 border rounded-lg bg-white text-color-text-main placeholder:text-color-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block ${
                  phoneError ? "border-red-500" : "border-border-block"
                }`}
                autoComplete="tel"
              />
              {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
            </div>

            <div>
              <label htmlFor="quick-buy-name" className="block text-sm font-medium text-color-text-main mb-1">
                Ваше имя
              </label>
              <input
                id="quick-buy-name"
                type="text"
                placeholder="Как к вам обращаться"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-border-block rounded-lg bg-white text-color-text-main placeholder:text-color-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block"
                autoComplete="name"
              />
            </div>

            {/* Итого */}
            <div className="flex items-center justify-end gap-2 py-2">
              <span className="text-sm font-medium text-color-text-secondary">Итого</span>
              <span className="text-lg font-semibold text-color-text-main">
                {product.price.toLocaleString("ru-RU")} ₽
              </span>
            </div>

            <p className="text-xs text-color-text-secondary text-center">
              мы с вами свяжемся в течение 5 минут и все сделаем по красоте
            </p>

            {submitError && <p className="text-sm text-red-600 text-center">{submitError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-medium rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
            >
              {loading ? "Отправка…" : "Отправить"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
