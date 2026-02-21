import type { MetadataRoute } from "next";
import { CANONICAL_BASE } from "@/lib/seo";

/**
 * robots.txt — сайт открыт для индексации.
 * Каталог, товары, блог разрешены. Закрыты только API, админка, служебные пути.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/_next/",
        "/admin/",
        "/storage/v1/object/public/", // Оригиналы Supabase Storage — не тратить Egress на краулеров
      ],
    },
    sitemap: `${CANONICAL_BASE}/sitemap.xml`,
    host: "theame.ru",
  };
}
