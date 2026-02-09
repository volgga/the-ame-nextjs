import Link from "next/link";
import { contactProviders } from "@/lib/contactProviders";

const MESSENGER_ORDER: ("whatsapp" | "telegram" | "max")[] = ["whatsapp", "telegram", "max"];

const BUTTON_LABELS: Record<string, string> = {
  whatsapp: "WHATSAPP",
  telegram: "TELEGRAM",
  max: "МАХ",
};

/**
 * Блок "Связаться с нами" для использования на страницах блога и других публичных страницах.
 * Переиспользует логику со страницы инструкции по уходу за цветами.
 */
export function ContactUsBlock() {
  const ctaProviders = MESSENGER_ORDER.map((type) => contactProviders.find((p) => p.type === type)).filter(
    (p): p is (typeof contactProviders)[0] => p != null && p.url != null
  );

  return (
    <section className="border-t border-color-border-block pt-6 md:pt-8 mt-8 md:mt-10">
      <p className="text-base md:text-lg font-medium text-color-text-main mb-4">Остались вопросы? Свяжитесь с нами:</p>
      <div className="flex flex-wrap items-center gap-2">
        {ctaProviders.map((p) => (
          <Link
            key={p.type}
            href={p.url!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.label}
            className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-[var(--color-text-main)] text-color-text-main text-xs font-medium uppercase tracking-wide hover:text-color-text-secondary hover:border-[var(--color-text-secondary)] transition-colors bg-transparent"
          >
            {BUTTON_LABELS[p.type] ?? p.label.toUpperCase()}
          </Link>
        ))}
      </div>
    </section>
  );
}
