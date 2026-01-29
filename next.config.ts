import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "theame.ru",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
