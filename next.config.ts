import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "placeholder.supabase.co";

// Дополнительные Supabase-проекты, если в БД есть URL из других инстансов
const supabaseHosts = [...new Set([supabaseHost, "eweaqbtqzzoxpwfmjinp.supabase.co"].filter(Boolean))];

const nextConfig: NextConfig = {
  // Standalone — критично для 1GB RAM: минимальный footprint, только нужные файлы
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["node_modules/sharp/**/*"],
  },
  // Отключаем проверку типов TypeScript во время сборки для ускорения (только для продакшн)
  typescript: {
    // В продакшн сборке пропускаем проверку типов - она занимает слишком много времени
    // Проверка типов должна выполняться в CI/CD или локально перед коммитом
    ignoreBuildErrors: process.env.NODE_ENV === "production" && process.env.SKIP_TYPES_CHECK !== "false",
  },
  // Отключаем полифиллы для современных браузеров (уменьшает размер бандла на ~13 KiB)
  compiler: {
    // SWC уже минифицирует, но можно добавить дополнительные опции если нужно
  },
  // Экспериментальные оптимизации
  experimental: {
    // Уменьшает блокировку отрисовки: объединяет/оптимизирует CSS (фото 1 — ожидаемая экономия ~820 мс)
    optimizeCss: true,
    // Tree-shaking для lucide-react и др. — меньше размер бандла
    optimizePackageImports: ["lucide-react"],
  },
  // Исключаем sharp из клиентского бандла (используется только в API routes)
  // Используем webpack вместо Turbopack для совместимости с sharp
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
  // Явно указываем использование webpack вместо Turbopack (для совместимости с sharp)
  // Turbopack не поддерживает некоторые нативные модули как sharp
  turbopack: undefined,
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
      // Редиректы для вариантов главной страницы (убираем дубли)
      { source: "/index", destination: "/", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/home.html", destination: "/", permanent: true },
      // Страниц по /blog и /magazine в приложении нет (контент: блог — /clients/blog, каталог — /magazin).
      // Редиректы не создают страницы, а только отдают 301, чтобы не было 404 в Вебмастере.
      { source: "/blog", destination: "/clients/blog", permanent: true },
      { source: "/blog/:path*", destination: "/clients/blog/:path*", permanent: true },
      { source: "/magazine", destination: "/magazin", permanent: true },
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
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable" }],
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
    unoptimized: false, // Включена оптимизация (sharp) — сервер 2GB RAM + 2 vCPU
    formats: ["image/avif", "image/webp"],
    deviceSizes: [430, 640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rharjnqjchmbpwqrxgey.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "theame.ru", pathname: "/**" },
      { protocol: "http", hostname: "theame.ru", pathname: "/**" },
      ...supabaseHosts.map((host) => ({
        protocol: "https" as const,
        hostname: host,
        port: "",
        pathname: "/storage/v1/object/public/**" as const,
      })),
    ],
  },
};

export default nextConfig;
