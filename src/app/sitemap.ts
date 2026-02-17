import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/categories";
import { getAllCatalogProducts } from "@/lib/products";
import { getSitemapBaseUrl } from "@/lib/base-url";
import { getPublishedPosts } from "@/lib/blog";

/** Виртуальные слоги категорий — не включаем в sitemap (редиректы или отдельные страницы). */
const VIRTUAL_CATEGORY_SLUGS = ["magazin", "posmotret-vse-tsvety"];

function absoluteUrl(base: string, path: string): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, base).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = getSitemapBaseUrl();
  const now = new Date().toISOString().split("T")[0];
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl(BASE, "/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    // /catalog редиректится на /magazin в middleware, не включаем в sitemap
    { url: absoluteUrl(BASE, "/clients/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl(BASE, "/about"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl(BASE, "/contacts"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl(BASE, "/delivery-and-payments"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    {
      url: absoluteUrl(BASE, "/instrukciya-po-uhodu-za-tsvetami"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    { url: absoluteUrl(BASE, "/corporate"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl(BASE, "/docs/oferta"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl(BASE, "/docs/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl(BASE, "/docs/return"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl(BASE, "/favorites"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl(BASE, "/magazin"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl(BASE, "/posmotret-vse-tsvety"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl(BASE, "/marketing-consent"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    // payment/success и payment/fail имеют robots: noindex, не включаем в sitemap
  ];

  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let products: Awaited<ReturnType<typeof getAllCatalogProducts>> = [];

  try {
    [categories, products] = await Promise.all([getCategories(), getAllCatalogProducts()]);
  } catch {
    // Без доступа к БД — только статические URL
  }

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => !VIRTUAL_CATEGORY_SLUGS.includes(c.slug))
    .map((c) => ({
      url: absoluteUrl(BASE, `/magazine/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(BASE, `/product/${p.slug}`),
    lastModified: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedPosts();
    blogPosts = posts.map((post) => ({
      url: absoluteUrl(BASE, `/clients/blog/${post.slug}`),
      lastModified: post.updated_at
        ? new Date(post.updated_at).toISOString().split("T")[0]
        : post.created_at
          ? new Date(post.created_at).toISOString().split("T")[0]
          : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // Без доступа к блогу — только статика и каталог
  }

  return [...staticRoutes, ...categoryEntries, ...productEntries, ...blogPosts];
}
