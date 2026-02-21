"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { addImageCacheBust, imageVersionFromUpdatedAt } from "@/utils/imageUtils";
import { AppImage } from "@/components/ui/AppImage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";
import type { BlogPost } from "@/lib/blog";

type BlogSliderProps = {
  /** Последние посты блога (уже ограничены по количеству на главной) */
  posts: BlogPost[];
  /** Дополнительные классы для секции */
  className?: string;
};

/**
 * Секция «Из блога» — горизонтальная лента последних постов под картой на главной.
 * Стрелки переключения, плавная прокрутка.
 */
export function BlogSlider({ posts, className = "" }: BlogSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState, posts.length]);

  const scrollBy = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = typeof window !== "undefined" && window.innerWidth < 768 ? 300 : 360;
    const delta = direction === "left" ? -step : step;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  if (posts.length === 0) return null;

  const btnClass =
    "flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-outline-border)] bg-transparent text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2";

  return (
    <section
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP} ${className}`}
      aria-labelledby="blog-feed-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        <div className={`${MAIN_PAGE_BLOCK_GAP_MARGIN} flex flex-col md:flex-row md:items-end md:justify-between md:gap-4`}>
          <div>
            <h2
              id="blog-feed-heading"
              className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] tracking-tight"
            >
              Блог и новости цветочного магазина The Ame
            </h2>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed w-full">
              В нашем блоге мы делимся полезными материалами о цветах, букетах и флористике, а также публикуем новости
              цветочного магазина The Ame. Здесь вы найдёте идеи для подарков, советы по уходу за цветами и актуальные
              обновления сервиса доставки цветов в Сочи.
            </p>
          </div>
          {posts.length > 1 && (
            <div className="flex items-center gap-0.5 shrink-0 mt-4 md:mt-0">
              <button
                type="button"
                onClick={() => scrollBy("left")}
                disabled={!canScrollLeft}
                className={btnClass}
                aria-label="Прокрутить влево"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => scrollBy("right")}
                disabled={!canScrollRight}
                className={btnClass}
                aria-label="Прокрутить вправо"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex flex-nowrap gap-4 md:gap-6 overflow-x-auto overflow-y-hidden py-2 pb-2 -mx-4 px-4 md:-mx-6 md:px-6 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/clients/blog/${post.slug}`}
              prefetch={false}
              className="group flex-shrink-0 w-[min(85vw,320px)] sm:w-[300px] md:w-[min(24vw,320px)] snap-start rounded-xl bg-white shadow-sm overflow-hidden border border-[var(--color-outline-border)] transition-all hover:shadow-md hover:border-[var(--color-outline-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                {post.cover_image_url ? (
                  <AppImage
                    src={addImageCacheBust(post.cover_image_url, imageVersionFromUpdatedAt(post.updated_at))}
                    alt={post.cover_alt ?? post.title}
                    fill
                    variant="blog"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 85vw, (max-width: 1024px) 300px, 320px"
                    quality={75}
                    loading="lazy"
                    imageData={{
                      image_url: addImageCacheBust(post.cover_image_url, imageVersionFromUpdatedAt(post.updated_at)),
                      image_thumb_url: post.cover_image_thumb_url
                        ? addImageCacheBust(post.cover_image_thumb_url, imageVersionFromUpdatedAt(post.updated_at))
                        : null,
                      image_medium_url: post.cover_image_medium_url
                        ? addImageCacheBust(post.cover_image_medium_url, imageVersionFromUpdatedAt(post.updated_at))
                        : null,
                      image_large_url: post.cover_image_large_url
                        ? addImageCacheBust(post.cover_image_large_url, imageVersionFromUpdatedAt(post.updated_at))
                        : null,
                      image_thumb_avif_url: post.cover_image_thumb_avif_url
                        ? addImageCacheBust(post.cover_image_thumb_avif_url, imageVersionFromUpdatedAt(post.updated_at))
                        : null,
                      image_medium_avif_url: post.cover_image_medium_avif_url
                        ? addImageCacheBust(post.cover_image_medium_avif_url, imageVersionFromUpdatedAt(post.updated_at))
                        : null,
                      image_large_avif_url: post.cover_image_large_avif_url
                        ? addImageCacheBust(post.cover_image_large_avif_url, imageVersionFromUpdatedAt(post.updated_at))
                        : null,
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                    Нет фото
                  </div>
                )}
              </div>
              <div className="p-4">
                <time
                  className="text-xs text-neutral-500"
                  dateTime={post.created_at}
                >
                  {new Date(post.created_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
                <h3 className="mt-2 text-lg font-semibold text-[var(--color-text-main)] line-clamp-2 group-hover:text-neutral-700">
                  {post.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                  {post.excerpt?.trim() || "Читать далее…"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
