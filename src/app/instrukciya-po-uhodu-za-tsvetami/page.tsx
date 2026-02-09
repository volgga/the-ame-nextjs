import type { Metadata } from "next";
import Link from "next/link";
import { Droplets, Scissors, SunDim, RefreshCw, Gift, Heart, Droplet, Leaf } from "lucide-react";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW } from "@/lib/seo";
import { contactProviders } from "@/lib/contactProviders";

export const metadata: Metadata = {
  title: "Как ухаживать за срезанными цветами | The Ame",
  description:
    "Расскажем как ухаживать и продлить жизнь букета или цветочной композиции из цветочного магазина The Ame",
  alternates: {
    canonical: canonicalUrl("/instrukciya-po-uhodu-za-tsvetami"),
  },
  robots: ROBOTS_INDEX_FOLLOW,
};

const CARE_BOUQUET_ITEMS: { icon: React.ReactNode; text: string }[] = [
  {
    icon: <Droplets className="size-5 shrink-0 text-color-text-main" />,
    text: "Вода в вашей вазе должна быть чистой и холодной.",
  },
  {
    icon: <Scissors className="size-5 shrink-0 text-color-text-main" />,
    text: "Подрезайте стебли на 1-2 см острым ножом или сектором под углом.",
  },
  {
    icon: <SunDim className="size-5 shrink-0 text-color-text-main" />,
    text: "Держите букет в дали от солнца, тепла, кухонных плит, батарей, сквозняков и фруктов.",
  },
  {
    icon: <RefreshCw className="size-5 shrink-0 text-color-text-main" />,
    text: "Обновляйте срез и воду каждые 1-2 дня, это поможет цветам максимально обильно питаться.",
  },
  {
    icon: <Gift className="size-5 shrink-0 text-color-text-main" />,
    text: "К букету мы приложили пакетик со специальным средством (кризал), которое поможет продлить жизнь цветов. Высыпьте его полностью в вазу, оно стерилизует воду и не дает бактериям, убивающим цветок, размножаться.",
  },
  {
    icon: <Heart className="size-5 shrink-0 text-color-text-main" />,
    text: "Любите эти цветы, дарите им свою улыбку — и тогда они обязательно будут радовать вас еще дольше!",
  },
];

const CARE_BASKET_ITEMS: { icon: React.ReactNode; text: string }[] = [
  {
    icon: <SunDim className="size-5 shrink-0 text-color-text-main" />,
    text: "Держите композицию в дали от солнца, тепла, кухонных плит, батарей, сквозняков и фруктов.",
  },
  {
    icon: <Droplet className="size-5 shrink-0 text-color-text-main" />,
    text: "Переодически доливайте воду в губку, примерно по 100-200мл в день.",
  },
  {
    icon: <Leaf className="size-5 shrink-0 text-color-text-main" />,
    text: "По мере увядания цветов удаляйте их из композиции, это продлит жизнь другим цветочкам.",
  },
  {
    icon: <Heart className="size-5 shrink-0 text-color-text-main" />,
    text: "Любуйтесь и делитесь красотой.",
  },
];

const MESSENGER_ORDER: ("whatsapp" | "telegram" | "max")[] = ["whatsapp", "telegram", "max"];
const BUTTON_LABELS: Record<string, string> = {
  whatsapp: "WHATSAPP",
  telegram: "TELEGRAM",
  max: "МАХ",
};

export default function CarePage() {
  const ctaProviders = MESSENGER_ORDER.map((type) => contactProviders.find((p) => p.type === type)).filter(
    (p): p is (typeof contactProviders)[0] => p != null && p.url != null
  );

  return (
    <div className="min-h-screen bg-page-bg">
      <article className="container mx-auto px-5 md:px-6 py-10 md:py-12 max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-color-text-main mb-5 md:mb-6">
          Инструкция по уходу за цветами от The Áme
        </h1>

        {/* Блок 1: Уход за букетом */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-semibold text-color-text-main mb-4">Уход за букетом</h2>
          <ul className="space-y-2">
            {CARE_BOUQUET_ITEMS.map((item, i) => (
              <li key={i} className="flex gap-3 items-start text-base md:text-lg text-color-text-main leading-relaxed">
                <span className="mt-0.5" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Блок 2: Уход за цветами в корзине/коробке */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-semibold text-color-text-main mb-4">
            Уход за цветами в корзине/коробке
          </h2>
          <ul className="space-y-2">
            {CARE_BASKET_ITEMS.map((item, i) => (
              <li key={i} className="flex gap-3 items-start text-base md:text-lg text-color-text-main leading-relaxed">
                <span className="mt-0.5" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA: Остались вопросы? */}
        <section className="border-t border-color-border-block pt-6 md:pt-8">
          <p className="text-base md:text-lg font-medium text-color-text-main mb-4">
            Остались вопросы? Свяжитесь с нами:
          </p>
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
      </article>
    </div>
  );
}
