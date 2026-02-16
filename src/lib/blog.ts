/**
 * Блог: загрузка опубликованных постов из Supabase (таблица blog_posts).
 */

import { unstable_cache } from "next/cache";
import { getSupabaseServer } from "@/lib/supabaseServer";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
  cover_alt: string | null;
  cover_caption: string | null;
  /** Варианты обложки для оптимизации */
  cover_image_thumb_url?: string | null;
  cover_image_medium_url?: string | null;
  cover_image_large_url?: string | null;
  cover_image_thumb_avif_url?: string | null;
  cover_image_medium_avif_url?: string | null;
  cover_image_large_avif_url?: string | null;
  published: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostNav = Pick<BlogPost, "id" | "slug" | "title">;

/**
 * Получить все опубликованные посты (для публичной страницы)
 */
async function getPublishedPostsUncached(): Promise<BlogPost[]> {
  try {
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[lib/blog getPublishedPosts]", error);
      }
      return [];
    }

    const posts = (data ?? []) as BlogPost[];

    // Стабильная сортировка: null sort_order обрабатываем как большое число
    const sortedPosts = [...posts].sort((a, b) => {
      const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      // Если sort_order одинаковый или оба null, сортируем по дате создания (новые выше)
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });

    // Формируем cover_image_url из cover_image_path, если нужно
    for (const post of sortedPosts) {
      if (post.cover_image_path && !post.cover_image_url) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: urlData } = (supabase as any).storage.from("blog").getPublicUrl(post.cover_image_path);
        post.cover_image_url = urlData.publicUrl;
      }
    }

    return sortedPosts;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[lib/blog getPublishedPosts]", e);
    }
    return [];
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  return unstable_cache(getPublishedPostsUncached, ["blog-posts"], {
    revalidate: 300,
    tags: ["blog-posts"],
  })();
}

/**
 * Получить один опубликованный пост по slug (для публичной страницы)
 */
async function getPublishedPostBySlugUncached(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Пост не найден
      }
      // Логируем только неожиданные ошибки
      if (process.env.NODE_ENV === "development") {
        console.error("[lib/blog getPublishedPostBySlug]", error);
      }
      return null;
    }

    const post = data as BlogPost;

    // Если есть cover_image_path, но нет cover_image_url, получаем публичный URL
    if (post.cover_image_path && !post.cover_image_url) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: urlData } = (supabase as any).storage.from("blog").getPublicUrl(post.cover_image_path);
      post.cover_image_url = urlData.publicUrl;
    }

    return post;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[lib/blog getPublishedPostBySlug]", e);
    }
    return null;
  }
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const cached = unstable_cache(() => getPublishedPostBySlugUncached(slug), ["blog-post", slug], {
    revalidate: 300,
    tags: ["blog-posts"],
  });
  return cached();
}

/**
 * Получить все slugs опубликованных постов (для generateStaticParams)
 */
export async function getPublishedPostSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts();
  return posts.map((post) => post.slug);
}

/**
 * Получить соседние посты (prev/next) для навигации
 */
async function getAdjacentPostsUncached(
  currentSlug: string
): Promise<{ prev: BlogPostNav | null; next: BlogPostNav | null }> {

  try {
    const supabase = getSupabaseServer();

    // Получаем все опубликованные посты, отсортированные по sort_order (как в листинге)
    // Важно: nullsFirst: false означает что null идут в конец, но для стабильности
    // лучше явно обработать null как большое число
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("id, slug, title, sort_order, created_at")
      .eq("published", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[lib/blog getAdjacentPosts]", error);
      }
      return { prev: null, next: null };
    }

    const posts = (data ?? []) as Array<
      Pick<BlogPost, "id" | "slug" | "title"> & { sort_order?: number | null; created_at?: string }
    >;

    // Стабильная сортировка: null sort_order обрабатываем как большое число
    const sortedPosts = [...posts].sort((a, b) => {
      const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      // Если sort_order одинаковый или оба null, сортируем по дате создания (новые выше)
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });

    const currentIndex = sortedPosts.findIndex((p) => p.slug === currentSlug);

    if (currentIndex === -1) {
      return { prev: null, next: null };
    }

    // Порядок как в списке: prev = предыдущий в массиве (выше в списке), next = следующий (ниже в списке)
    const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

    // Возвращаем только базовые данные, без дополнительных запросов
    return {
      prev: prevPost
        ? {
            id: prevPost.id,
            slug: prevPost.slug,
            title: prevPost.title,
          }
        : null,
      next: nextPost
        ? {
            id: nextPost.id,
            slug: nextPost.slug,
            title: nextPost.title,
          }
        : null,
    };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[lib/blog getAdjacentPosts]", e);
    }
    return { prev: null, next: null };
  }
}

export async function getAdjacentPosts(
  currentSlug: string
): Promise<{ prev: BlogPostNav | null; next: BlogPostNav | null }> {
  const cached = unstable_cache(() => getAdjacentPostsUncached(currentSlug), ["blog-adjacent", currentSlug], {
    revalidate: 300,
    tags: ["blog-posts"],
  });
  return cached();
}
