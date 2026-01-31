import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  /** aria-label для навигации */
  ariaLabel?: string;
};

/**
 * Breadcrumbs — хлебные крошки навигации.
 * Формат: Главная / Каталог / {Название категории}
 * Последний элемент без ссылки (текущая страница).
 */
export function Breadcrumbs({ items, ariaLabel = "Навигация" }: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel} className="mb-6 md:mb-8">
      <ol
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
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
                <span className="text-muted-foreground/70" aria-hidden="true">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  itemProp="item"
                  className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span itemProp="name" className="text-muted-foreground" aria-current="page">
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
