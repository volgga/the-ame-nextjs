import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "placeholder.supabase.co";
const supabaseHosts = [...new Set([supabaseHost, "eweaqbtqzzoxpwfmjinp.supabase.co"].filter(Boolean))];

const nextConfig: NextConfig = {
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
      { source: "/_next/image", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable" }] },
      { source: "/IMG_4256.JPG", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/sitemap.xml", headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }] },
      { source: "/robots.txt", headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }] },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "rharjnqjchmbpwqrxgey.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "theame.ru", pathname: "/**" },
      { protocol: "http", hostname: "theame.ru", pathname: "/**" },
      ...supabaseHosts.map((host) => ({ protocol: "https" as const, hostname: host })),
    ],
  },
};

export default nextConfig;
