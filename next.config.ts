import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "placeholder.supabase.co";

// Дополнительные Supabase-проекты, если в БД есть URL из других инстансов
const supabaseHosts = [...new Set([supabaseHost, "eweaqbtqzzoxpwfmjinp.supabase.co"].filter(Boolean))];

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/privacy", destination: "/docs/privacy", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "theame.ru",
        pathname: "/**",
      },
      ...supabaseHosts.map((host) => ({
        protocol: "https" as const,
        hostname: host,
        pathname: "/storage/v1/object/public/**" as const,
      })),
    ],
  },
};

export default nextConfig;
