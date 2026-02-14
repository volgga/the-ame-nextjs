import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW, SITE_NAME, LOCALE, CANONICAL_BASE, buildAutoDescription } from "@/lib/seo";
import { getPublishedPostBySlug, getPublishedPostSlugs, getAdjacentPosts } from "@/lib/blog";
import DOMPurify from "isomorphic-dompurify";
import { ContactUsBlock } from "@/components/sections/ContactUsBlock";
import { BlogPostNavigation } from "@/components/blog/BlogPostNavigation";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "Статья не найдена | The Ame",
    };
  }

  const title = `${post.title} | The Ame`;
  // Используем ручной excerpt или генерируем автоматически из контента
  const description = post.excerpt?.trim() ? post.excerpt.trim() : buildAutoDescription(post.content);
  const url = canonicalUrl(`/clients/blog/${slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: ROBOTS_INDEX_FOLLOW,
    openGraph: {
      type: "article",
      locale: LOCALE,
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: post.cover_image_url
        ? [{ url: post.cover_image_url, width: 1200, height: 630, alt: post.title }]
        : [{ url: `${CANONICAL_BASE}/IMG_1543.PNG`, width: 900, height: 1200, alt: post.title }],
      publishedTime: post.created_at,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : [`${CANONICAL_BASE}/IMG_1543.PNG`],
    },
  };
}

export default async function ClientsBlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, adjacentPosts] = await Promise.all([getPublishedPostBySlug(slug), getAdjacentPosts(slug)]);

  if (!post) {
    notFound();
  }

  // Санитизируем HTML контент
  const sanitizedContent = DOMPurify.sanitize(post.content || "", {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h2", "h3", "ul", "ol", "li", "a", "img"],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class"],
  });

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container mx-auto px-4 md:px-8 pt-2 pb-8 md:pt-4 md:pb-10">
        {/* Шапка статьи: слева кнопка-стрелка, заголовок по центру с переносом */}
        <div className="flex items-center gap-3 mb-4 min-w-0">
          <Link
            href="/clients/blog"
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main"
            aria-label="Назад к списку статей"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="min-w-0 flex-1 text-center text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-black line-clamp-2 px-1">
            {post.title}
          </h1>
          <div className="w-10 shrink-0" aria-hidden />
        </div>

        {/* Дата публикации — по центру */}
        <div className="mb-6 text-center">
          <time className="text-sm text-neutral-500" dateTime={post.created_at}>
            {new Date(post.created_at).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        {/* Hero изображение — в том же контейнере, что и текст */}
        {post.cover_image_url && (
          <div className="mb-10">
            <div className="relative w-full aspect-[16/7] overflow-hidden bg-neutral-100 rounded-lg">
              <Image
                src={post.cover_image_url}
                alt={post.cover_alt || post.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
                quality={80}
              />
            </div>
            {post.cover_caption && <p className="mt-4 text-center text-sm text-neutral-500">{post.cover_caption}</p>}
          </div>
        )}

        {/* Текст статьи */}
        <article
          className="blog-post-content mb-8"
          dangerouslySetInnerHTML={{ __html: sanitizedContent || "<p>Контент отсутствует</p>" }}
        />

        {/* Блок "Связаться с нами" */}
        <ContactUsBlock />

        {/* Навигация между статьями */}
        <BlogPostNavigation prev={adjacentPosts.prev} next={adjacentPosts.next} />
      </div>
    </div>
  );
}
