"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/lib/products";
import { submitGiftHint } from "@/lib/formsClient";

type GiftHintModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
};

export function GiftHintModal({ isOpen, onClose, product }: GiftHintModalProps) {
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [phone, setPhone] = useState("+7 (");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Закрытие по Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      setFromName("");
      setToName("");
      setPhone("+7 (");
      setAgreed(false);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  // Блокировка скролла страницы при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("7")) value = value.slice(1);
    if (value.length > 10) value = value.slice(0, 10);

    let formatted = "+7 (";
    if (value.length > 0) formatted += value.slice(0, 3);
    if (value.length > 3) formatted += ") " + value.slice(3, 6);
    if (value.length > 6) formatted += "-" + value.slice(6, 8);
    if (value.length > 8) formatted += "-" + value.slice(8, 10);

    setPhone(formatted);
  };

  const isValid = fromName.trim() && toName.trim() && phone.length >= 18 && agreed;

  const handleSubmit = async () => {
    if (!isValid) {
      setError("Заполните все обязательные поля и примите условия");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pageUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      const payload = {
        phone: phone.trim(),
        name: fromName.trim() || undefined,
        recipientName: toName.trim() || undefined,
        productTitle: product.title,
        pageUrl,
        productId: product.id?.toString?.() ?? undefined,
      };
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        console.log("[GiftHint] payload", payload);
      }

      const data = await submitGiftHint(payload);

      if (!data.ok) {
        setError(data.error ?? "Ошибка при отправке");
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const content = (
    <>
      {/* Overlay — выше хедера (z-40); фиксированный поверх страницы */}
      <div
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — fixed, выше overlay; скролл при переполнении */}
      <div
        className="fixed left-1/2 top-1/2 z-[70] max-h-[90vh] w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-2xl bg-white p-4 sm:p-6 shadow-xl box-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-color-text-secondary hover:text-color-text-main transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-color-text-main/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-color-text-main" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-color-text-main mb-2">Отправили намёк</h3>
            <p className="text-color-text-secondary text-sm mb-6">
              Сообщение будет отправлено получателю в ближайшее время.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 text-white rounded-lg transition-colors bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-color-text-main mb-3">Намекнуть ?</h2>
            <p className="text-sm text-color-text-secondary mb-6 leading-relaxed">
              Вам понравилась наша композиция и Вы хотели бы получить ее в качестве подарка от близкого человека?
              Заполните форму, и ему придет сообщение с Вашим намеком :)
            </p>

            {/* Форма: на mobile одна колонка, ровные отступы, без горизонтального скролла */}
            <div className="space-y-4 min-w-0">
              {/* Ваше имя */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-color-text-main mb-1.5">
                  Ваше имя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Как к вам обращаться ?"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full min-w-0 px-4 py-3 border border-border-block rounded-lg bg-white text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block box-border"
                />
              </div>

              {/* Имя кому отправить и Телефон: на mobile одна колонка, на md — две */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-color-text-main mb-1.5">
                    Имя кому отправить <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Как к вам обращаться ?"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    className="w-full min-w-0 px-4 py-3 border border-border-block rounded-lg bg-white text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block box-border"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-color-text-main mb-1.5">
                    Телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full min-w-0 px-4 py-3 border border-border-block rounded-lg bg-white text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block box-border"
                  />
                </div>
              </div>

              {/* Чекбокс */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="gift-hint-agreement"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border-block text-accent-btn focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                />
                <label htmlFor="gift-hint-agreement" className="text-xs text-color-text-secondary leading-relaxed">
                  Нажимая кнопку отправить Вы принимаете условия{" "}
                  <a
                    href="/docs/oferta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1F3B2C] hover:text-[#1F3B2C] underline"
                  >
                    Пользовательского соглашения
                  </a>{" "}
                  и{" "}
                  <a
                    href="/docs/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1F3B2C] hover:text-[#1F3B2C] underline"
                  >
                    Политики конфиденциальности
                  </a>
                </label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Кнопка отправки */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="w-full py-3 text-white font-medium uppercase rounded-lg transition-colors disabled:cursor-not-allowed bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
              >
                {loading ? "Отправка..." : "ОТПРАВИТЬ"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
}
