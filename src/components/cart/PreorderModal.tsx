"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AppImage } from "@/components/ui/AppImage";
import { X } from "lucide-react";
import { submitPreorder } from "@/lib/formsClient";
import { PhoneInput, toE164, isValidPhone } from "@/components/ui/PhoneInput";

export type PreorderProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  /** Путь к странице товара, например /product/slug (для полной ссылки в Telegram) */
  productPath?: string;
  /** Id варианта (если предзаказ оформлен для конкретного варианта) */
  variantId?: string | number;
  /** Название варианта (для отображения/аналитики) */
  variantTitle?: string | null;
};

type PreorderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: PreorderProduct;
};

const Z_OVERLAY = 200;
const Z_PANEL = 201;

function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().split("T")[0]!;
}

/**
 * PreorderModal — модалка «Предзаказ».
 * По структуре максимально повторяет QuickBuyModal, но с полем даты.
 */
export function PreorderModal({ isOpen, onClose, product }: PreorderModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preorderDate, setPreorderDate] = useState(getTodayISO());
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
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

  const validateDate = (value: string): string | null => {
    if (!value) return "Выберите дату";
    const today = getTodayISO();
    if (value < today) return "Дата не может быть в прошлом";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setDateError(null);
    setSubmitError(null);

    const phoneE164 = toE164(phone);
    if (!phoneE164) {
      setPhoneError("Укажите номер телефона");
      return;
    }
    if (!isValidPhone(phoneE164)) {
      setPhoneError("Введите корректный номер телефона");
      return;
    }

    const dateValidationError = validateDate(preorderDate);
    if (dateValidationError) {
      setDateError(dateValidationError);
      return;
    }

    setLoading(true);
    try {
      const pageUrl =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined;
      const payload = {
        phone: phoneE164,
        name: name.trim() || undefined,
        preorderDate,
        productTitle: product.name,
        pageUrl,
        productId: product.id || undefined,
        productPath: product.productPath || undefined,
        variantId: product.variantId != null ? String(product.variantId) : undefined,
        variantTitle: product.variantTitle || undefined,
      };
      const data = await submitPreorder(payload);

      if (!data.ok) {
        setSubmitError(data.error ?? "Ошибка при отправке. Попробуйте ещё раз.");
        setLoading(false);
        return;
      }

      setLoading(false);
      if (typeof window !== "undefined") {
        window.alert("Заявка на предзаказ отправлена! Мы свяжемся с вами в течение 5 минут.");
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col min-w-0"
        style={{ zIndex: Z_PANEL, maxWidth: "calc(100vw - 32px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-block">
          <h2 className="text-xl font-semibold text-color-text-main">Предзаказ</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-color-text-secondary hover:text-color-text-main hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden flex-1 p-4 max-w-full">
          {/* Позиция: мини-фото, название, количество, цена */}
          <div className="flex items-center gap-3 p-3 bg-[rgba(31,42,31,0.06)] rounded-xl mb-6">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#ece9e2]">
              <AppImage
                src={
                  product.image?.trim() && (product.image.startsWith("http") || product.image.startsWith("/"))
                    ? product.image
                    : "/placeholder.svg"
                }
                alt={product.name}
                fill
                variant="thumb"
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

          <form onSubmit={handleSubmit} className="space-y-4 min-w-0 max-w-full">
            <div>
              <PhoneInput
                id="preorder-phone"
                value={phone}
                onChange={(v) => {
                  setPhone(v);
                  if (phoneError) setPhoneError(null);
                }}
                label="Ваш телефон"
                required
                error={phoneError ?? undefined}
              />
            </div>

            <div>
              <label htmlFor="preorder-name" className="block text-sm font-medium text-color-text-main mb-1">
                Ваше имя
              </label>
              <input
                id="preorder-name"
                type="text"
                placeholder="Как к вам обращаться"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 min-h-[48px] border border-border-block rounded-lg bg-white text-color-text-main placeholder:text-color-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block"
                autoComplete="name"
              />
            </div>

            <div className="w-full min-w-0">
              <label htmlFor="preorder-date" className="block text-sm font-medium text-color-text-main mb-1">
                Дата получения
              </label>
              <input
                id="preorder-date"
                type="date"
                value={preorderDate}
                onChange={(e) => {
                  setPreorderDate(e.target.value);
                  if (dateError) setDateError(null);
                }}
                min={getTodayISO()}
                lang="ru"
                className="w-full min-w-0 box-border px-4 py-3 min-h-[48px] border border-border-block rounded-lg bg-white text-color-text-main focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block overflow-hidden"
              />
              {dateError && <p className="text-sm text-red-600 mt-1">{dateError}</p>}
            </div>

            {/* Итого */}
            <div className="flex items-center justify-end gap-2 py-2">
              <span className="text-sm font-medium text-color-text-secondary">Итого</span>
              <span className="text-lg font-semibold text-color-text-main">
                {product.price.toLocaleString("ru-RU")} ₽
              </span>
            </div>

            <p className="text-xs text-color-text-secondary text-center">
              Мы с вами свяжемся в течение 5 минут и поможем вам
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

