import type { MetadataRoute } from "next";
import { CANONICAL_BASE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/", "/admin/"],
    },
    sitemap: `${CANONICAL_BASE}/sitemap.xml`,
    host: "theame.ru",
  };
}
