import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/categories";
import { getAllCatalogProducts } from "@/lib/products";

const BASE_URL = "https://theame.ru";

/** Виртуальные слоги категорий — не включаем в sitemap (редиректы или отдельные страницы). */
const VIRTUAL_CATEGORY_SLUGS = ["magazin", "posmotret-vse-tsvety"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString().split("T")[0];
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/contacts`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/delivery-and-payments`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/docs/care`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/docs/corporate`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/docs/oferta`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/docs/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/docs/return`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/favorites`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/magazin`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/posmotret-vse-tsvety`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/marketing-consent`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/payment/success`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/payment/fail`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
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
      url: `${BASE_URL}/magazine/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryEntries, ...productEntries];
}
