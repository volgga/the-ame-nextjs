"use client";

import { useState } from "react";
import Link from "next/link";
import { AppImage } from "@/components/ui/AppImage";
import { ArrowRight } from "lucide-react";
import { PhoneInput, toE164, isValidPhone } from "@/components/ui/PhoneInput";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";
import { ContactsModal } from "@/components/ContactsModal";
import { contactProviders } from "@/lib/contactProviders";
import { submitBouquet } from "@/lib/formsClient";

const DEFAULT_TITLE = "Заказать букет вашей мечты";
const DEFAULT_SUBTITLE1 = "";
const DEFAULT_TEXT =
  "Соберём букет вашей мечты и доставим по Сочи уже сегодня. Оставьте заявку на сайте или позвоните нам — мы подберём идеальное сочетание цветов под ваш повод и бюджет.";
const DEFAULT_IMAGE = "/IMG_1543.PNG";

export type OrderBouquetSectionProps = {
  /** Заголовок блока (из админки) */
  title?: string | null;
  /** Подзаголовок №1 — серый текст под заголовком (из админки) */
  subtitle1?: string | null;
  /** Основной текст (из админки) */
  text?: string | null;
  /** URL изображения (из админки). Если нет — используется дефолтное фото */
  imageUrl?: string | null;
};

/**
 * Секция "Заказать букет вашей мечты".
 * Порядок: 1) Заголовок (справа), 2) Подзаголовок №1, 3) Основной текст, 4) Кнопка «→ НАПИСАТЬ НАМ», 5) Форма заказа.
 * Изображение справа — такой же размер и пропорции (1:1), как в блоке «О нас».
 * Форма заказа не изменяется.
 */
export function OrderBouquetSection({ title, subtitle1, text, imageUrl }: OrderBouquetSectionProps = {}) {
  const blockTitle = title?.trim() || DEFAULT_TITLE;
  const blockSubtitle1 = subtitle1?.trim() ?? DEFAULT_SUBTITLE1;
  const blockText = text?.trim() || DEFAULT_TEXT;
  const blockImageUrl = imageUrl?.trim() || DEFAULT_IMAGE;

  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const phoneE164 = toE164(phone);
  const isPhoneValid = phoneE164 !== "" && isValidPhone(phoneE164);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setPhoneError("");
    setConsentError("");

    let isValid = true;
    if (!name.trim()) {
      setNameError("Укажите ваше имя");
      isValid = false;
    }
    if (!phoneE164) {
      setPhoneError("Укажите номер телефона");
      isValid = false;
    } else if (!isValidPhone(phoneE164)) {
      setPhoneError("Введите корректный номер телефона");
      isValid = false;
    }
    if (!consent) {
      setConsentError("Необходимо согласие на обработку персональных данных");
      isValid = false;
    }
    if (!isValid) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const pageUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined;
      const payload = {
        phone: phoneE164,
        name: name.trim() || undefined,
        pageUrl: pageUrl || undefined,
      };
      const result = await submitBouquet(payload);
      if (result.ok) {
        setSubmitted(true);
        setName("");
        setPhone("");
        setConsent(false);
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        setSubmitError(result.error || "Не удалось отправить заявку. Попробуйте позже.");
      }
    } catch {
      setSubmitError("Ошибка отправки. Проверьте интернет и попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP}`} aria-labelledby="order-bouquet-heading">
        <div className="container mx-auto px-4 md:px-6">
          {/* Разделительная линия между секциями (как на остальной главной) */}
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="w-full max-w-5xl section-divider-line" aria-hidden />
          </div>
          {/* Заголовок слева, кнопка «Написать нам» справа (как «Подробнее о нас» выше) */}
          <div className={MAIN_PAGE_BLOCK_GAP_MARGIN}>
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-baseline md:justify-between md:gap-4">
              <h2
                id="order-bouquet-heading"
                className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)] uppercase tracking-tight"
              >
                {blockTitle}
              </h2>
              <button
                type="button"
                onClick={() => setSocialModalOpen(true)}
                className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-full border border-[var(--color-outline-border)] bg-transparent px-4 py-2 text-sm font-medium uppercase tracking-tight text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 shrink-0"
              >
                <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />
                НАПИСАТЬ НАМ
              </button>
            </div>
          </div>

          {/* Flex: изображение слева, текст и форма справа; на десктопе высота ряда = высоте формы, фото подстраивается (низ фото = низ кнопки «Отправить») */}
          <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-16">
            <div className="order-2 md:order-1 w-full md:flex-[0_0_50%] md:min-h-0">
              <div className="relative aspect-square md:aspect-auto w-full md:h-full overflow-hidden rounded-2xl border border-border-block bg-white md:max-h-[calc(100vh-14rem)]">
                <AppImage
                  src={blockImageUrl}
                  alt="Букет вашей мечты"
                  fill
                  variant="card"
                  className="object-cover h-full w-full"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={75}
                  priority
                  loading="eager"
                  // TODO: Добавить imageData когда OrderBouquetSection будет иметь варианты изображений
                />
              </div>
            </div>

            {/* Правая колонка: подзаголовок №1, основной текст, форма */}
            <div className="flex flex-col order-1 md:order-2 md:flex-1 md:min-w-0 md:pl-8">
              <div className="flex-1 space-y-4 pl-0 pr-0">
                {blockSubtitle1 ? (
                  <div className="space-y-3 text-lg md:text-xl text-[var(--color-text-secondary)] leading-normal font-medium">
                    {blockSubtitle1
                      .split("\n")
                      .filter((line) => line.length > 0)
                      .map((line, index) => (
                        <p key={`sub1-${index}-${line.slice(0, 15)}`}>{line}</p>
                      ))}
                  </div>
                ) : null}
                <p className="text-sm md:text-base text-[var(--color-text-main)] leading-normal whitespace-pre-line">
                  {blockText.split("—").flatMap((part, index) =>
                    index === 0
                      ? [part]
                      : [
                          <span key={`dash-${index}`} className="text-[var(--color-text-secondary)]">
                            —
                          </span>,
                          part,
                        ]
                  )}
                </p>

                <form onSubmit={handleSubmit} className="space-y-3 w-full" suppressHydrationWarning>
                  <div>
                    <input
                      type="text"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError("");
                      }}
                      className={`w-full px-4 py-2.5 border rounded-lg bg-white text-[var(--color-text-main)] placeholder:text-[var(--color-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block ${
                        nameError ? "border-red-500" : "border-gray-300"
                      }`}
                      autoComplete="name"
                    />
                    {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
                  </div>
                  <PhoneInput
                    value={phone}
                    onChange={(v) => {
                      setPhone(v);
                      if (phoneError) setPhoneError("");
                    }}
                    error={phoneError}
                  />
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
                      <span className="text-xs leading-snug text-[var(--color-text-main)]">
                        Нажимая кнопку «Отправить», Вы принимаете условия{" "}
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
                  {submitError && <p className="text-sm text-red-600 text-center">{submitError}</p>}
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={!name.trim() || !phoneE164 || !isPhoneValid || !consent || submitting || submitted}
                      className="px-6 py-2.5 rounded-full font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed bg-header-bg text-header-foreground hover:opacity-90 active:opacity-95"
                    >
                      {submitting ? "Отправка…" : submitted ? "Заявка отправлена" : "Отправить"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactsModal
        isOpen={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        providers={contactProviders}
        socialOnly
      />
    </>
  );
}
