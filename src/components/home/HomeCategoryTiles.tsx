"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { HomeCollection } from "@/lib/homeCollections";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";

type HomeCategoryTilesProps = {
  collections: HomeCollection[];
};

/**
 * Блок «КОЛЛЕКЦИИ THE ÁME» — сетка карточек коллекций на главной.
 * Данные из админки (home_collections). Заголовок + кнопка «СМОТРЕТЬ ВСЕ» над гридом.
 * Если коллекций нет — блок скрыт.
 *
 * Премиум эффект появления: строки появляются по очереди при прокрутке,
 * внутри строки карточки идут слева направо с stagger.
 */
export function HomeCategoryTiles({ collections }: HomeCategoryTilesProps) {
  const [isReady, setIsReady] = useState(false);
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());
  const [cardRowMap, setCardRowMap] = useState<Map<string, { rowIndex: number; cardIndexInRow: number }>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const observersRef = useRef<Map<number, IntersectionObserver>>(new Map());

  // SSR-safe: скрытие применяется только после mount на клиенте
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Группировка карточек по строкам через offsetTop
  useEffect(() => {
    if (!isReady || !gridRef.current) return;

    // Проверяем prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Если reduced motion - показываем все сразу
      const allRows = new Set<number>();
      const rowMap = new Map<string, { rowIndex: number; cardIndexInRow: number }>();
      let rowIndex = 0;
      let cardIndexInRow = 0;
      collections.forEach((col) => {
        rowMap.set(col.id, { rowIndex, cardIndexInRow });
        cardIndexInRow++;
        // Предполагаем 3 колонки для desktop (будет пересчитано ниже)
        if (cardIndexInRow >= 3) {
          allRows.add(rowIndex);
          rowIndex++;
          cardIndexInRow = 0;
        }
      });
      if (cardIndexInRow > 0) {
        allRows.add(rowIndex);
      }
      setVisibleRows(allRows);
      setCardRowMap(rowMap);
      return;
    }

    // Копируем ref в переменную для корректной очистки в cleanup (react-hooks/exhaustive-deps)
    const observersMap = observersRef.current;

    // Небольшая задержка для обеспечения правильного рендера и вычисления offsetTop
    const timer = setTimeout(() => {
      const cards = Array.from(cardRefs.current.entries());
      if (cards.length === 0) return;

      // Группируем карточки по offsetTop (с допуском в 3px для погрешности)
      const rowsMap = new Map<number, Array<[string, HTMLAnchorElement]>>();
      cards.forEach(([cardKey, card]) => {
        const top = Math.round(card.offsetTop / 3) * 3; // Округляем до кратных 3
        if (!rowsMap.has(top)) {
          rowsMap.set(top, []);
        }
        rowsMap.get(top)!.push([cardKey, card]);
      });

      // Сортируем строки по offsetTop и создаем массив строк
      const rows = Array.from(rowsMap.entries())
        .sort(([topA], [topB]) => topA - topB)
        .map(([, cards]) => cards.sort(([_, cardA], [__, cardB]) => cardA.offsetLeft - cardB.offsetLeft)); // Сортируем по offsetLeft внутри строки

      // Создаем маппинг карточка -> строка и позиция в строке
      const newCardRowMap = new Map<string, { rowIndex: number; cardIndexInRow: number }>();
      rows.forEach((rowCards, rowIndex) => {
        rowCards.forEach(([cardKey], cardIndexInRow) => {
          newCardRowMap.set(cardKey, { rowIndex, cardIndexInRow });
        });
      });
      setCardRowMap(newCardRowMap);

      // Очищаем предыдущие observers
      observersMap.forEach((observer) => observer.disconnect());
      observersMap.clear();

      // Создаем observer для каждой строки
      rows.forEach((rowCards, rowIndex) => {
        if (rowCards.length === 0) return;

        // Используем первую карточку строки как trigger
        const triggerCard = rowCards[0][1];

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                // Строка попала в viewport - показываем все карточки этой строки
                setVisibleRows((prev) => {
                  const next = new Set(prev);
                  next.add(rowIndex);
                  return next;
                });
                // Отключаем observer после первого срабатывания
                observer.unobserve(triggerCard);
                observersMap.delete(rowIndex);
              }
            });
          },
          {
            threshold: 0.25, // 25% видимости
            rootMargin: "0px",
          }
        );

        observer.observe(triggerCard);
        observersMap.set(rowIndex, observer);
      });

      // Первая строка показывается сразу (если она уже в viewport)
      if (rows.length > 0) {
        const firstRowCards = rows[0];
        if (firstRowCards.length > 0) {
          const firstCard = firstRowCards[0][1];
          const rect = firstCard.getBoundingClientRect();
          const isInViewport = rect.top < window.innerHeight * 0.8;
          if (isInViewport) {
            setVisibleRows((prev) => {
              const next = new Set(prev);
              next.add(0);
              return next;
            });
          }
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      observersMap.forEach((observer) => observer.disconnect());
      observersMap.clear();
    };
  }, [isReady, collections]);

  if (!collections.length) return null;

  return (
    <section
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP} ${isReady ? "reveal-ready" : ""}`}
      aria-labelledby="collections-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Разделительная линия над секцией */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        <div className={MAIN_PAGE_BLOCK_GAP_MARGIN}>
          {/* Верхняя строка: заголовок слева, кнопка "Смотреть всё" справа */}
          <div className="flex items-center justify-between gap-4">
            <h2
              id="collections-heading"
              className="text-3xl md:text-4xl lg:text-[48px] font-bold text-[var(--color-text-main)] uppercase tracking-tight"
            >
              КОЛЛЕКЦИИ THE ÁME
            </h2>
            <Link
              href="/magazin"
              className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-full border border-[var(--color-outline-border)] bg-transparent px-4 py-2 text-sm font-medium uppercase tracking-tight text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 shrink-0"
            >
              <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />
              СМОТРЕТЬ ВСЕ
            </Link>
          </div>
        </div>
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {collections.map((col) => {
            const href =
              !col.categorySlug || col.categorySlug === "magazin" ? "/magazin" : `/magazine/${col.categorySlug}`;
            const imageSrc =
              col.imageUrl?.trim() && (col.imageUrl.startsWith("http") || col.imageUrl.startsWith("/"))
                ? col.imageUrl
                : "/placeholder.svg";
            const cardKey = col.id;
            const rowInfo = cardRowMap.get(cardKey);
            const isRowVisible = rowInfo ? visibleRows.has(rowInfo.rowIndex) : false;
            const staggerDelay = rowInfo ? rowInfo.cardIndexInRow * 160 : 0; // 160ms между карточками в строке (премиум, мягче)

            return (
              <Link
                key={col.id}
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(cardKey, el);
                  } else {
                    cardRefs.current.delete(cardKey);
                  }
                }}
                href={href}
                className={`group relative block w-full overflow-hidden rounded-2xl bg-[#ece9e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline-border)] focus-visible:ring-offset-2 reveal reveal--stagger ${isRowVisible ? "reveal--in" : ""}`}
                style={{ "--stagger-delay": `${staggerDelay}ms` } as React.CSSProperties}
                aria-label={col.name}
              >
                {/* Изображение с overlay */}
                <div className="relative w-full aspect-square overflow-hidden">
                  <Image
                    src={imageSrc}
                    alt=""
                    fill
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  {/* Градиент снизу для читаемости текста */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/35 via-black/20 to-transparent pointer-events-none"
                    aria-hidden
                  />
                  {/* Overlay: название сверху слева, стрелка сверху справа, описание снизу */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Название коллекции - сверху слева */}
                    <h3 className="absolute top-4 left-4 md:top-5 md:left-5 text-white font-bold text-lg md:text-xl lg:text-2xl uppercase tracking-tight drop-shadow-lg">
                      {col.name}
                    </h3>
                    {/* Стрелка - сверху справа */}
                    <div className="absolute top-4 right-4 md:top-5 md:right-5">
                      <ArrowRight
                        className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-lg"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    </div>
                    {/* Описание - снизу на фото */}
                    {col.description && col.description.trim() && (
                      <p className="absolute bottom-4 left-4 md:bottom-5 md:left-5 right-4 md:right-5 text-white text-sm md:text-base leading-relaxed drop-shadow-lg">
                        {col.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
