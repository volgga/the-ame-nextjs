"use client";

import Link from "next/link";

type TopMarqueeProps = {
  phrases?: string[];
  href?: string;
  speed?: number; // секунды на один полный цикл
  duplicates?: number;
};

/**
 * TopMarquee — бегущая строка вверху шапки.
 * CSS animation без библиотек.
 */
/** Ссылка категории «14 февраля» (тот же формат, что в каталоге) */
const MARQUEE_HREF = "/magazine/14-fevralya";

export function TopMarquee({
  phrases = ["Один клик и ты герой 14 февраля"],
  href = MARQUEE_HREF,
  speed = 50,
  duplicates = 6,
}: TopMarqueeProps) {
  // Формируем дорожку: повторяем массив фраз нужное количество раз
  const row: string[] = [];
  for (let i = 0; i < duplicates; i++) {
    row.push(...phrases);
  }

  // Дублируем для бесшовности
  const content = [...row, ...row];

  return (
    <Link
      href={href}
      className="block w-full overflow-hidden bg-ticker-bg text-ticker-foreground h-8 flex items-center cursor-pointer hover:opacity-[0.85] transition-opacity"
      style={{ borderBottom: "0.5px solid rgba(31, 42, 31, 0.65)" }}
      aria-label="Перейти в категорию 14 февраля"
    >
      <div
        className="flex items-center whitespace-nowrap"
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
      >
        {content.map((text, i) => (
          <div key={i} className="flex items-center">
            <span className="py-1.5 px-8 text-xs uppercase tracking-wide">{text}</span>
            <span className="mx-6 inline-flex items-center justify-center" aria-hidden>
              <span className="block w-2 h-2 rounded-full bg-current" />
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}
