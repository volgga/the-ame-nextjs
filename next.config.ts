import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "placeholder.supabase.co";

// Дополнительные Supabase-проекты, если в БД есть URL из других инстансов
const supabaseHosts = [...new Set([supabaseHost, "eweaqbtqzzoxpwfmjinp.supabase.co"].filter(Boolean))];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy", destination: "/docs/privacy", permanent: true },
      {
        source: "/docs/care",
        destination: "/instrukciya-po-uhodu-za-tsvetami",
        permanent: true,
      },
      {
        source: "/instrukciya-po-uhodu",
        destination: "/instrukciya-po-uhodu-za-tsvetami",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sitemap.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }],
      },
      {
        source: "/robots.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "theame.ru", pathname: "/**" },
      { protocol: "http", hostname: "theame.ru", pathname: "/**" },
      ...supabaseHosts.map((host) => ({
        protocol: "https" as const,
        hostname: host,
        pathname: "/**" as const,
      })),
    ],
  },
};

export default nextConfig;
