"use client";

import Link from "next/link";

type TopMarqueeProps = {
  /** Массив фраз. Между фразами автоматически вставляется жирная точка (•). */
  phrases: string[];
  /** @deprecated Используйте phrases. Если phrases пуст, используется как единственная фраза. */
  text?: string | null;
  /** Ссылка при клике; пусто/не задано — не кликабельно */
  href?: string | null;
  /** Секунды на один полный цикл анимации */
  speed?: number;
  /** Сколько раз повторить блок в ряду для бесшовности */
  duplicates?: number;
};

/**
 * TopMarquee — бегущая строка вверху шапки.
 * CSS animation без библиотек. Между фразами — жирная точка (•), одинаковые отступы.
 * Если href задан — клик ведёт на ссылку (та же вкладка).
 */
export function TopMarquee({ phrases: phrasesProp, text, href, speed = 50, duplicates = 6 }: TopMarqueeProps) {
  const phrases = phrasesProp.length > 0 ? phrasesProp : (text?.trim() ? [text.trim()] : []);
  if (phrases.length === 0) return null;

  const fullText = phrases.join(" • ");

  /* Массив блоков для анимации: каждый блок = фразы через крупные разделители */
  const phraseBlocks: React.ReactNode[] = [];
  for (let d = 0; d < duplicates * 2; d++) {
    phrases.forEach((phrase, pIdx) => {
      phraseBlocks.push(
        <span key={`${d}-${pIdx}`} className="py-1 px-6 sm:px-8 text-xs uppercase tracking-wide leading-none" style={{ lineHeight: 1 }}>
          {phrase}
        </span>
      );
      if (pIdx < phrases.length - 1) {
        phraseBlocks.push(
          <span key={`${d}-sep-${pIdx}`} className="mx-2 sm:mx-3 inline-flex items-center justify-center shrink-0 text-2xl font-bold leading-none" aria-hidden>
            •
          </span>
        );
      }
    });
  }

  /* Фиксированный line-height и высота — чтобы промо-полоса не прыгала при загрузке шрифтов (CLS). Жирные точки между ВСЕМИ фразами. */
  const inner = (
    <div className="flex items-center shrink-0 whitespace-nowrap" style={{ animation: `marquee ${speed}s linear infinite`, lineHeight: 1 }}>
      {phraseBlocks}
    </div>
  );

  const wrapperClass =
    "block w-full overflow-hidden text-ticker-foreground h-7 min-h-[28px] max-h-[28px] flex items-center shrink-0 " + (href ? "cursor-pointer" : "");
  const style = { backgroundColor: "var(--page-bg)" };

  if (href && href.trim() !== "") {
    return (
      <Link href={href} className={wrapperClass} style={style} aria-label={fullText}>
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
