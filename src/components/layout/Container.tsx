import { type ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  /** Дополнительные классы для контейнера */
  className?: string;
  /** Максимальная ширина контейнера (например "980px", "1200px") */
  maxWidth?: string;
};

/**
 * Container — единый контейнер для всех страниц с эталонными горизонтальными отступами.
 * Эталон: компоненты главной страницы используют `container mx-auto px-4 md:px-6`.
 *
 * Mobile: px-4 (16px)
 * Desktop (md+): px-6 (24px)
 *
 * Учитывает, что AppShell уже дает `px-0.5 md:px-8` на main элементе.
 */
export function Container({ children, className = "", maxWidth }: ContainerProps) {
  const classes = ["container mx-auto px-4 md:px-6", maxWidth && `max-w-[${maxWidth}]`, className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
