"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Link from "next/link";

const inputBaseClass =
  "w-full px-4 py-2.5 border rounded-lg bg-white text-[var(--color-text-main)] placeholder:text-[var(--color-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block";
const inputErrorClass = "border-red-500";

type SendMessageModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * SendMessageModal — модалка только с формой «ОТПРАВИТЬ СООБЩЕНИЕ» (Имя, Телефон, Сообщение, согласие, Отправить).
 * Используется в хедере по кнопке «Заказать звонок». z-50 overlay, z-[60] модалка.
 */
export function SendMessageModal({ isOpen, onClose }: SendMessageModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7 (");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setMounted(true), []);

  // Форматирование телефона как в модалке корзины: +7 (XXX) XXX-XX-XX
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
    if (phoneError) setPhoneError("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submitted) return;
    setNameError("");
    setPhoneError("");
    setConsentError("");
    let isValid = true;
    if (!name.trim()) {
      setNameError("Укажите ваше имя");
      isValid = false;
    }
    if (!phone.trim()) {
      setPhoneError("Укажите номер телефона");
      isValid = false;
    } else if (phone.replace(/\D/g, "").length < 10) {
      setPhoneError("Введите корректный номер телефона");
      isValid = false;
    }
    if (!consent) {
      setConsentError("Необходимо согласие на обработку персональных данных");
      isValid = false;
    }
    if (!isValid) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setName("");
        setMessage("");
        setPhone("+7 (");
        setConsent(false);
        setSubmitted(false);
      }, 3000);
    }, 500);
  };

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

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const content = (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-[60] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[500px] max-h-[90vh] bg-white shadow-2xl rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto h-full max-h-[90vh]">
          <div className="grid grid-cols-3 items-center gap-2 pt-4 px-6 sticky top-0 bg-white z-10 pb-2">
            <div className="w-10" aria-hidden />
            <div className="text-center">
              <h2 className="text-lg font-bold uppercase tracking-tight text-color-text-main">
                ОТПРАВИТЬ СООБЩЕНИЕ
              </h2>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80 flex-shrink-0 text-color-text-main"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-color-text-main mb-1">Имя <span className="text-red-500" aria-hidden>*</span></label>
                <input
                  type="text"
                  placeholder="Как к Вам обращаться?"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  className={`${inputBaseClass} ${nameError ? inputErrorClass : "border-gray-300"}`}
                  autoComplete="name"
                />
                {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-color-text-main mb-1">Телефон <span className="text-red-500" aria-hidden>*</span></label>
                <input
                  type="tel"
                  placeholder="+7 (000) 000-00-00"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`${inputBaseClass} ${phoneError ? inputErrorClass : "border-gray-300"}`}
                  autoComplete="tel"
                />
                {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-color-text-main mb-1">Сообщение</label>
                <textarea
                  placeholder="Ваш вопрос или пожелание?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className={`${inputBaseClass} resize-none border-gray-300`}
                />
              </div>
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (consentError) setConsentError("");
                    }}
                    className="mt-1 w-4 h-4 accent-[var(--color-accent-btn)] cursor-pointer"
                  />
                  <span className="text-sm text-[var(--color-text-main)]">
                    Нажимая кнопку отправить Вы принимаете условия{" "}
                    <Link href="/docs/oferta" className="underline hover:no-underline">
                      Пользовательского соглашения
                    </Link>{" "}
                    и{" "}
                    <Link href="/docs/privacy" className="underline hover:no-underline">
                      Политики конфиденциальности
                    </Link>
                    .
                  </span>
                </label>
                {consentError && <p className="mt-1 text-sm text-red-600">{consentError}</p>}
              </div>
              <div>
                <button
                  type="submit"
                  disabled={
                    !name.trim() ||
                    !phone.trim() ||
                    phone.replace(/\D/g, "").length < 10 ||
                    !consent ||
                    submitting ||
                    submitted
                  }
                  className="w-full py-3 rounded-lg font-medium uppercase tracking-tight transition-colors disabled:opacity-70 disabled:cursor-not-allowed bg-header-bg text-header-foreground hover:opacity-90 active:opacity-95"
                >
                  {submitting ? "Отправка…" : submitted ? "Заявка отправлена" : "ОТПРАВИТЬ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
