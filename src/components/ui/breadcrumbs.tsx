import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  /** aria-label для навигации */
  ariaLabel?: string;
  /** Дополнительные классы для nav */
  className?: string;
};

/** Единые отступы хлебных крошек: синхронизированы между каталогом и карточкой товара */
export const BREADCRUMB_SPACING = "mt-0 mb-3 md:mb-4";

/** Вертикальный отступ между блоками (breadcrumb→контент, заголовок→след. блок и т.д.). Эталон: карточка товара. */
export const SECTION_GAP = "mb-3 md:mb-4";

/** Единый вертикальный зазор на главной: hero→РЕКОМЕНДУЕМ (+32px mobile / +40px md для лёгкого визуального разделения) */
export const MAIN_PAGE_BLOCK_GAP = "pt-8 md:pt-10" as const;
export const MAIN_PAGE_BLOCK_GAP_MARGIN = "mb-6 md:mb-8" as const;

/**
 * Breadcrumbs — хлебные крошки навигации.
 * Формат: Главная / Каталог / {Название категории}
 * Последний элемент без ссылки (текущая страница).
 */
export function Breadcrumbs({ items, ariaLabel = "Навигация", className }: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel} className={className ?? BREADCRUMB_SPACING}>
      <ol
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li
              key={i}
              className="flex items-center gap-x-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {i > 0 && (
                <span className="text-color-text-secondary" aria-hidden="true">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  itemProp="item"
                  className="text-color-text-secondary hover:text-color-text-main hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 rounded-sm"
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span itemProp="name" className="text-color-text-main font-medium no-underline" aria-current="page">
                  {item.label}
                </span>
              )}
              <meta itemProp="position" content={String(i + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
