"use client";

import Link from "next/link";
import { contactProviders } from "@/lib/contactProviders";

const ORDER: ("whatsapp" | "telegram" | "phone" | "max")[] = ["telegram", "whatsapp", "max", "phone"];

const BUTTON_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  phone: "Позвонить",
  max: "MAX",
};

type CorporateCtaButtonsProps = {
  /** URL для кнопки MAX; если не передан — берётся из contactProviders */
  maxLink?: string | null;
};

/**
 * Кнопки CTA для страницы «Корпоративные заказы»: Telegram, WhatsApp, MAX, Позвонить.
 * На мобиле: сетка по 2 в ряд.
 */
export function CorporateCtaButtons({ maxLink }: CorporateCtaButtonsProps) {
  const telegram = contactProviders.find((p) => p.type === "telegram");
  const whatsapp = contactProviders.find((p) => p.type === "whatsapp");
  const phone = contactProviders.find((p) => p.type === "phone");
  const maxProvider = contactProviders.find((p) => p.type === "max");
  const maxUrl = (maxLink && maxLink.trim()) || maxProvider?.url;

  const providers = { telegram: telegram?.url, whatsapp: whatsapp?.url, phone: phone?.url, max: maxUrl } as const;
  const buttons: { label: string; href: string }[] = ORDER.filter((k) => providers[k]).map((k) => ({
    label: BUTTON_LABELS[k],
    href: providers[k]!,
  }));

  const btnClass =
    "inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-medium uppercase tracking-wide border-2 border-[var(--color-text-main)] text-[var(--color-text-main)] bg-transparent hover:bg-[var(--color-text-main)] hover:text-white transition-colors";

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
      {buttons.map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          target={href.startsWith("tel:") ? undefined : "_blank"}
          rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
          className={btnClass}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
