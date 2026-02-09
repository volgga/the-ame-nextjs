import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW, SITE_NAME, LOCALE } from "@/lib/seo";
import { getAboutPage } from "@/lib/about";
import DOMPurify from "isomorphic-dompurify";

const TITLE = "О студии цветов The Ame в Сочи";
const DESCRIPTION =
  "The Ame — сервис доставки цветов в Сочи. Свежие букеты, внимание к деталям и забота о каждом заказе.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/about") },
  robots: ROBOTS_INDEX_FOLLOW,
  openGraph: {
    type: "website",
    locale: LOCALE,
    url: canonicalUrl("/about"),
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function AboutPage() {
  const page = await getAboutPage();

  // Если данных нет, показываем дефолтный контент
  if (!page) {
    return (
      <div className="bg-page-bg">
        <Container maxWidth="980px" className="pb-12 pt-6">
          <h1 className="mb-8 text-center text-4xl font-semibold tracking-tight text-black sm:text-5xl">О НАС</h1>
          <div className="space-y-5 text-[18px] leading-relaxed text-neutral-700">
            <p>Страница находится в разработке.</p>
          </div>
        </Container>
      </div>
    );
  }

  // Санитизируем HTML контент
  const sanitizedContent = DOMPurify.sanitize(page.content || "", {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h2", "h3", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });

  const pageTitle = page.title || "О НАС";

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container mx-auto px-4 md:px-8 pt-2 pb-8 md:pt-4 md:pb-10">
        {/* Заголовок по центру */}
        <h1 className="mb-6 text-center text-3xl md:text-4xl font-semibold tracking-tight text-black">{pageTitle}</h1>

        {/* Hero изображение — в том же стиле, что у статей блога */}
        {page.cover_image_url && (
          <div className="mb-10">
            <div className="relative w-full aspect-[16/7] overflow-hidden bg-neutral-100 rounded-lg">
              <Image
                src={page.cover_image_url}
                alt={page.cover_alt || pageTitle}
                fill
                priority
                className="object-cover"
                sizes="100vw"
                quality={90}
              />
            </div>
            {page.cover_caption && <p className="mt-4 text-center text-sm text-neutral-500">{page.cover_caption}</p>}
          </div>
        )}

        {/* Текст страницы */}
        <article
          className="blog-post-content mb-8"
          dangerouslySetInnerHTML={{ __html: sanitizedContent || "<p>Контент отсутствует</p>" }}
        />
      </div>
    </div>
  );
}
