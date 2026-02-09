import Link from "next/link";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

type AdjacentPost = {
  id: string;
  slug: string;
  title: string;
};

type BlogPostNavigationProps = {
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
};

/**
 * Навигация между статьями блога (prev/next) с кнопкой "На главную" по центру
 */
export function BlogPostNavigation({ prev, next }: BlogPostNavigationProps) {
  if (!prev && !next) {
    return null;
  }

  return (
    <nav className="border-t border-color-border-block pt-6 md:pt-8 mt-8 md:mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Предыдущая статья */}
        {prev ? (
          <Link
            href={`/clients/blog/${prev.slug}`}
            className="group flex items-center gap-3 p-4 rounded-lg border border-color-border-block hover:border-color-text-main transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-color-text-main shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-color-text-secondary uppercase tracking-wide mb-1">Предыдущая статья</div>
              <div className="text-sm md:text-base font-medium text-color-text-main line-clamp-2 group-hover:text-color-text-secondary transition-colors">
                {prev.title}
              </div>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {/* Кнопка "В блог" */}
        <div className="flex items-center justify-center">
          <Link
            href="/clients/blog"
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-color-border-block hover:border-color-text-main transition-colors min-h-[80px]"
          >
            <Home className="w-5 h-5 text-color-text-main" />
            <span className="text-xs text-color-text-secondary uppercase tracking-wide">В блог</span>
          </Link>
        </div>

        {/* Следующая статья */}
        {next ? (
          <Link
            href={`/clients/blog/${next.slug}`}
            className="group flex items-center gap-3 p-4 rounded-lg border border-color-border-block hover:border-color-text-main transition-colors md:text-right"
          >
            <div className="flex-1 min-w-0 md:text-right">
              <div className="text-xs text-color-text-secondary uppercase tracking-wide mb-1">Следующая статья</div>
              <div className="text-sm md:text-base font-medium text-color-text-main line-clamp-2 group-hover:text-color-text-secondary transition-colors">
                {next.title}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-color-text-main shrink-0" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </nav>
  );
}
