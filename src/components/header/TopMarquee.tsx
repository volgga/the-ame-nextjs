"use client";

import Link from "next/link";

type TopMarqueeProps = {
  /** Текст бегущей строки (одна фраза, повторяется для анимации) */
  text: string;
  /** Ссылка при клике; пусто/не задано — не кликабельно */
  href?: string | null;
  /** Секунды на один полный цикл анимации */
  speed?: number;
  /** Сколько раз повторить фразу в ряду для бесшовности */
  duplicates?: number;
};

/**
 * TopMarquee — бегущая строка вверху шапки.
 * CSS animation без библиотек. Если href задан — клик ведёт на ссылку (та же вкладка).
 * Вызывать только при enabled && text.trim() (при пустом тексте возвращает null).
 */
export function TopMarquee({ text, href, speed = 50, duplicates = 6 }: TopMarqueeProps) {
  if (!text?.trim()) return null;
  const phrases = [text.trim()];
  const row: string[] = [];
  for (let i = 0; i < duplicates; i++) {
    row.push(...phrases);
  }
  const content = [...row, ...row];

  const inner = (
    <div className="flex items-center whitespace-nowrap" style={{ animation: `marquee ${speed}s linear infinite` }}>
      {content.map((t, i) => (
        <div key={i} className="flex items-center">
          <span className="py-1 px-8 text-xs uppercase tracking-wide">{t}</span>
          <span className="mx-6 inline-flex items-center justify-center" aria-hidden>
            <span className="block w-2 h-2 rounded-full bg-current" />
          </span>
        </div>
      ))}
    </div>
  );

  const wrapperClass =
    "block w-full overflow-hidden text-ticker-foreground h-7 flex items-center " + (href ? "cursor-pointer" : "");
  const style = { backgroundColor: "var(--page-bg)" };

  if (href && href.trim() !== "") {
    return (
      <Link href={href} className={wrapperClass} style={style} aria-label={text}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={wrapperClass} style={style} aria-hidden>
      {inner}
    </div>
  );
}
