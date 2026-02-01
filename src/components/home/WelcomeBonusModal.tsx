"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * WelcomeBonusModal (упрощённая версия без внешних библиотек).
 *
 * Почему "use client":
 * - есть таймер, sessionStorage, обработчики ввода/клика (это работает только в браузере)
 *
 * Важно:
 * - В оригинале данные уходят в Supabase + WhatsApp API.
 * - Здесь пока только UI + базовая валидация, чтобы главная собиралась в Next.js без новых библиотек.
 */
export function WelcomeBonusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem("hasSeenWelcomeModal");
    if (!hasSeenModal) {
      const t = window.setTimeout(() => setIsOpen(true), 1000);
      return () => window.clearTimeout(t);
    }
  }, []);

  const close = () => {
    setIsOpen(false);
    sessionStorage.setItem("hasSeenWelcomeModal", "true");
  };

  const submit = async () => {
    setError(null);

    if (!name.trim() || !phone.trim() || !agreeToTerms) {
      setError("Пожалуйста, заполните все поля и подтвердите согласие.");
      return;
    }

    // Заглушка: позже подключим реальную отправку в БД/мессенджер.
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = useMemo(() => {
    return (
      <div className="p-6 pt-12 sm:p-8 sm:pt-12">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-color-text-main/10 rounded-lg flex items-center justify-center mb-4">
            <span className="text-3xl" aria-hidden>
              🎁
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Приветственный бонус</h2>
          <p className="text-muted-foreground">
            Зарегистрируйтесь и получите промокод на первую покупку
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="welcome-name" className="block text-sm font-medium">
              Ваше имя
            </label>
            <input
              id="welcome-name"
              type="text"
              placeholder="Введите имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-11 w-full rounded-md border border-input bg-white px-3 text-foreground outline-none focus:ring-2 focus:ring-ring/40"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="welcome-phone" className="block text-sm font-medium">
              Номер телефона
            </label>
            <input
              id="welcome-phone"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 h-11 w-full rounded-md border border-input bg-white px-3 text-foreground outline-none focus:ring-2 focus:ring-ring/40"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          <label className="flex items-start gap-3 py-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border border-input"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              Я согласен(а) с обработкой персональных данных
            </span>
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-full text-white font-semibold transition-colors bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
          >
            {isSubmitting ? "Отправка..." : "Получить промокод"}
          </button>
        </div>
      </div>
    );
  }, [agreeToTerms, error, isSubmitting, name, phone]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Приветственный бонус"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Затемнение */}
      <div
        className="absolute inset-0 bg-black/35"
        onClick={close}
        aria-hidden
      />

      {/* Окно */}
      <div className="relative w-[92vw] max-w-2xl max-h-[80vh] overflow-y-auto bg-white border shadow-lg rounded-2xl">
        <button
          type="button"
          aria-label="Закрыть"
          onClick={close}
          className="absolute right-3 top-3 h-10 w-10 rounded-full hover:bg-muted grid place-items-center"
        >
          <span className="text-2xl leading-none" aria-hidden>
            ×
          </span>
        </button>
        {content}
      </div>
    </div>
  );
}

