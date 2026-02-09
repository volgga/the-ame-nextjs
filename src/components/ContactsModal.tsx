"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Provider = {
  type: string;
  src: string;
  srcModal: string;
  label: string;
  background: string;
  url?: string;
};

type ContactsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  providers: Provider[];
  /** Если true — только соцсети и «позвоните нам», без формы «Отправить сообщение». Для нижнего плавающего кружка. */
  socialOnly?: boolean;
};

const inputBaseClass =
  "w-full px-4 py-2.5 border rounded-lg bg-white text-[var(--color-text-main)] placeholder:text-[var(--color-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block";
const inputErrorClass = "border-red-500";

/**
 * ContactsModal — модалка с контактами (соцсети, телефон). При socialOnly=false также показывает форму «Отправить сообщение».
 * Используется нижним плавающим кружком с socialOnly=true (только соцсети/позвонить). Закрывается по X, overlay, Esc.
 */
export function ContactsModal({ isOpen, onClose, providers, socialOnly = false }: ContactsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setMounted(true), []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d+\s()\-]/g, "");
    setPhone(value);
    if (phoneError) setPhoneError("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    } else if (phone.replace(/\D/g, "").length < 7) {
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
        setPhone("");
        setMessage("");
        setConsent(false);
        setSubmitted(false);
      }, 3000);
    }, 500);
  };

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

  // Закрытие по Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const content = (
    <>
      {/* Overlay — затемняет всё (marquee, шапку, страницу); z-50 выше header z-40 */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Модалка по центру экрана */}
      <div
        className="fixed left-1/2 top-1/2 z-[60] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[500px] max-h-[90vh] bg-white shadow-2xl rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-social-only={socialOnly || undefined}
      >
        {/* Скроллируемый контент */}
        <div className="overflow-y-auto h-full max-h-[90vh]">
          {/* Шапка: 3 колонки — пусто / заголовок по центру / крестик справа; при socialOnly — прижата к верху */}
          <div
            className={`grid grid-cols-3 items-center gap-2 px-6 sticky top-0 bg-white z-10 pb-2 ${socialOnly ? "pt-2" : "pt-4"}`}
          >
            <div className="w-10" aria-hidden />
            <div className="flex flex-col items-center justify-center gap-1 min-h-0">
              <p className="text-xl md:text-2xl font-bold leading-tight text-color-text-main m-0 text-center whitespace-nowrap">
                The Áme
              </p>
              <p className="text-xs md:text-sm text-muted-foreground leading-tight m-0 text-center whitespace-nowrap tracking-normal">
                ЦВЕТЫ × ЧУВСТВА
              </p>
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

          {/* Контент модалки: единый padding-x для текста и блока кнопок (при socialOnly — px-4, иначе px-6) */}
          <div className={socialOnly ? "px-4 pb-6 space-y-6" : "px-6 pb-6 space-y-6"}>
            {/* Текст над кнопками: при socialOnly показываем только его, при полной модалке — перед формой */}
            {socialOnly && (
              <div className="text-center space-y-2 text-sm text-foreground">
                <p>Ответим Вам в течение 10 минут. Мы на связи с 9:00 до 21:00.</p>
                <p>Круглосуточная доставка при заказе до 21:00.</p>
                <p className="text-muted-foreground italic">(Наблюдаются сбои в работе WhatsApp)</p>
              </div>
            )}
            {!socialOnly && (
              <>
                {/* Текст */}
                <div className="text-center space-y-2 text-sm text-foreground">
                  <p>Ответим Вам в течение 10 минут. Мы на связи с 9:00 до 21:00.</p>
                  <p>Круглосуточная доставка при заказе до 21:00.</p>
                  <p className="text-muted-foreground italic">(Наблюдаются сбои в работе WhatsApp)</p>
                </div>

                {/* Форма «Отправить сообщение» — только когда не socialOnly */}
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <h3 className="text-base font-semibold text-color-text-main">Отправить сообщение</h3>
                  <div>
                    <input
                      type="text"
                      placeholder="Ваше имя"
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
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🇷🇺</span>
                      <input
                        type="tel"
                        placeholder="+7 (000) 000-00-00"
                        value={phone}
                        onChange={handlePhoneChange}
                        className={`${inputBaseClass} pl-12 pr-4 ${phoneError ? inputErrorClass : "border-gray-300"}`}
                        autoComplete="tel"
                      />
                    </div>
                    {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
                  </div>
                  <div>
                    <textarea
                      placeholder="Сообщение (необязательно)"
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
                        required
                      />
                      <span className="text-sm text-[var(--color-text-main)]">
                        Нажимая кнопку, вы подтверждаете свое согласие на обработку персональных данных.
                      </span>
                    </label>
                    {consentError && <p className="mt-1 text-sm text-red-600">{consentError}</p>}
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={submitting || submitted}
                      className="w-full py-3 rounded-full text-white font-medium uppercase tracking-tight transition-colors disabled:opacity-70 disabled:cursor-not-allowed bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
                    >
                      {submitting ? "Отправка…" : submitted ? "Заявка отправлена" : "Отправить"}
                    </button>
                  </div>
                </form>

                {/* Разделитель */}
                <div className="border-t border-border-block" />
              </>
            )}

            {/* Кнопки мессенджеров: flex-row, иконка слева, текст влево (justify-start), без обрезания */}
            <div className="grid grid-cols-2 gap-3">
              {providers
                .filter((p) => p.type !== "phone")
                .map((provider) => (
                  <a
                    key={provider.type}
                    href={provider.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center h-[76px] min-h-[76px] rounded-xl text-white transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/30 gap-1.5 pl-3"
                    style={{
                      backgroundImage: provider.background,
                      backgroundSize: "100% 100%",
                      backgroundColor: "transparent",
                    }}
                  >
                    {/* Левый слот: иконка с подложкой, отступ слева внутри кнопки */}
                    <div className="w-[52px] min-w-[52px] flex items-center justify-center flex-shrink-0">
                      <span className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                        <img src={provider.src} alt={provider.label} className="w-7 h-7 object-contain block" />
                      </span>
                    </div>
                    {/* Название: по левому краю, без truncate, помещается целиком */}
                    <div className="flex-1 flex items-center justify-start min-w-0 pr-2">
                      <span className="font-semibold text-white text-left text-sm min-w-0">{provider.label}</span>
                    </div>
                  </a>
                ))}
            </div>

            {/* Разделитель */}
            <div className="border-t border-border-block" />

            {/* Телефон — текст и outline-иконка на белом фоне */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Предпочитаете звонить? Ответим на Ваши вопросы</p>
              <a
                href="tel:+79939326095"
                className="inline-flex items-center justify-center gap-2 transition-colors hover:opacity-80 text-color-text-main"
              >
                <img
                  src="/icons/phone-outline.svg"
                  alt="Телефон"
                  className="w-5 h-5 flex-shrink-0 object-contain block"
                />
                <span className="text-lg font-semibold">+7 993 932-60-95</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
