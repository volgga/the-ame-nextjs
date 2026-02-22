import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "placeholder.supabase.co";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/privacy", destination: "/docs/privacy", permanent: true },
      { source: "/docs/care", destination: "/instrukciya-po-uhodu-za-tsvetami", permanent: true },
      { source: "/instrukciya-po-uhodu", destination: "/instrukciya-po-uhodu-za-tsvetami", permanent: true },
      { source: "/docs/corporate", destination: "/corporate", permanent: true },
      { source: "/index", destination: "/", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/home.html", destination: "/", permanent: true },
      { source: "/blog", destination: "/clients/blog", permanent: true },
      { source: "/blog/:path*", destination: "/clients/blog/:path*", permanent: true },
      { source: "/magazine", destination: "/magazin", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/icons/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // next/image — все изображения (в т.ч. с nfezvjentfuzjuwrjfya.supabase.co) проходят через этот роут.
      // Cache-Control 1 месяц — критично для экономии ~19 ГБ Egress.
      { source: "/_next/image", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
      { source: "/sitemap.xml", headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }] },
      { source: "/robots.txt", headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }] },
    ];
  },
  images: {
    ...(process.env.NODE_ENV === "development" && { unoptimized: true }),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "theame.ru", pathname: "/**" },
      { protocol: "https" as const, hostname: supabaseHost },
    ],
  },
};

export default nextConfig;
