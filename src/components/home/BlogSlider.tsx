import Link from "next/link";
import Image from "next/image";
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
 * На мобиле: swipe/scroll в одну линию; на десктопе видно 3–4 карточки.
 */
export function BlogSlider({ posts, className = "" }: BlogSliderProps) {
  if (posts.length === 0) return null;

  return (
    <section
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP} ${className}`}
      aria-labelledby="blog-feed-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        <div className={MAIN_PAGE_BLOCK_GAP_MARGIN}>
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

        <div
          className="flex flex-nowrap gap-4 md:gap-6 overflow-x-auto overflow-y-hidden py-2 pb-2 -mx-4 px-4 md:-mx-6 md:px-6 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/clients/blog/${post.slug}`}
              className="group flex-shrink-0 w-[min(85vw,320px)] sm:w-[300px] md:w-[min(24vw,320px)] snap-start rounded-xl bg-white shadow-sm overflow-hidden border border-[var(--color-outline-border)] transition-all hover:shadow-md hover:border-[var(--color-outline-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                {post.cover_image_url ? (
                  <Image
                    src={post.cover_image_url}
                    alt={post.cover_alt ?? post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 300px, 320px"
                    quality={85}
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
