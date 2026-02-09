import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW, SITE_NAME, LOCALE, CANONICAL_BASE } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/blog";

const TITLE = "Лайфхаки и цветочные новости | The Ame";
const DESCRIPTION =
  "Лайфхаки по уходу за цветами, флористические тренды, советы по выбору букетов и новости The Ame. Полезные статьи о цветах, подарках и вдохновении.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/clients/blog") },
  robots: ROBOTS_INDEX_FOLLOW,
  openGraph: {
    type: "website",
    locale: LOCALE,
    url: canonicalUrl("/clients/blog"),
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${CANONICAL_BASE}/IMG_1543.PNG`, width: 900, height: 1200, alt: TITLE }],
  },
};

export default async function ClientsBlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container mx-auto px-4 md:px-8 pt-2 pb-8 md:pt-4 md:pb-10">
        {/* Заголовок страницы */}
        <h1 className="mb-4 text-center text-3xl md:text-4xl font-semibold tracking-tight text-black">БЛОГ</h1>

        {/* Подзаголовок */}
        <h2 className="mb-4 text-center text-lg md:text-xl text-neutral-700 font-medium">
          Полезные статьи о цветах, флористике и вдохновении
        </h2>

        {/* Вводный SEO-текст */}
        <p className="mb-8 text-left text-sm md:text-base leading-relaxed text-neutral-600">
          Блог The Ame — это полезные лайфхаки по уходу за цветами, флористические новости, тренды и идеи для
          вдохновения. Мы делимся советами, как выбрать идеальный букет, продлить жизнь цветам, подобрать подарок и быть
          в курсе актуальных цветочных тенденций. Здесь вы найдете статьи о флористике, эстетике, подарках и настроении,
          которые помогут сделать каждый момент особенным.
        </p>

        {/* Сетка карточек статей */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600 text-lg mb-2">Статьи скоро появятся</p>
            <p className="text-neutral-500 text-sm">Мы готовим для вас полезный контент о цветах и флористике</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/clients/blog/${post.slug}`}
                className="group block overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                {/* Превью-картинка */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                  {post.cover_image_url ? (
                    <Image
                      src={post.cover_image_url}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={85}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">Нет фото</div>
                  )}
                </div>

                {/* Контент карточки */}
                <div className="p-5">
                  {/* Дата */}
                  <time className="text-xs text-neutral-500" dateTime={post.created_at}>
                    {new Date(post.created_at).toLocaleDateString("ru-RU", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>

                  {/* Заголовок */}
                  <h2 className="mt-2 text-xl font-semibold text-black line-clamp-2 group-hover:text-neutral-700">
                    {post.title}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
