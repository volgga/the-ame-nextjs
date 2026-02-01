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
export function TopMarquee({
  phrases = ["Гарантия 3 дня", "Цветочный консьерж", "Доставка за 45 минут"],
  href = "/posmotret-vse-tsvety",
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
    <div
      className="w-full overflow-hidden bg-ticker-bg text-ticker-foreground h-9 flex items-center"
      style={{ borderBottom: "0.5px solid rgba(31, 42, 31, 0.65)" }}
    >
      <div
        className="flex items-center whitespace-nowrap"
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
      >
        {content.map((text, i) => (
          <div key={i} className="flex items-center">
            {/* Кликабельная каждая фраза */}
            <Link
              href={href}
              className="py-2 px-8 text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
            >
              {text}
            </Link>

            {/* Кружок-разделитель строго между фразами */}
            <span className="mx-6 inline-flex items-center justify-center" aria-hidden>
              <span className="block w-2 h-2 rounded-full bg-current" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
