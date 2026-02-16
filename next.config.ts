import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "placeholder.supabase.co";

// Дополнительные Supabase-проекты, если в БД есть URL из других инстансов
const supabaseHosts = [...new Set([supabaseHost, "eweaqbtqzzoxpwfmjinp.supabase.co"].filter(Boolean))];

const nextConfig: NextConfig = {
  // Отключаем полифиллы для современных браузеров (уменьшает размер бандла на ~13 KiB)
  compiler: {
    // SWC уже минифицирует, но можно добавить дополнительные опции если нужно
  },
  // Экспериментальные оптимизации
  experimental: {
    optimizeCss: false,
    // Tree-shaking для lucide-react и др. — меньше размер бандла
    optimizePackageImports: ["lucide-react"],
  },
  // Исключаем sharp из клиентского бандла (используется только в API routes)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Исключаем sharp из клиентского бандла
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp: false,
      };
    }
    return config;
  },
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
      { source: "/docs/corporate", destination: "/corporate", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/IMG_4256.JPG",
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
    formats: ["image/avif", "image/webp"],
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
