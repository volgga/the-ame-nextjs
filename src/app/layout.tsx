import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/app/AppShell";
import { CANONICAL_BASE, SITE_NAME, LOCALE } from "@/lib/seo";
import { getHomeMarquee } from "@/lib/homeMarquee";

// Подключаем шрифт Montserrat (как в старом проекте)
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
});

/**
 * Root layout — только глобальные настройки (metadataBase, icons, manifest).
 * Title, description, openGraph, canonical — каждая страница задаёт СВОИ в metadata/generateMetadata.
 * Это предотвращает дублирование "| The Ame | The Ame" и гарантирует один title/description на страницу.
 */
export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_BASE),
  title: {
    default: SITE_NAME,
    template: `%s`, // Без template-суффикса — страницы задают полный title включая "| The Ame"
  },
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: LOCALE,
    siteName: SITE_NAME,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const marquee = await getHomeMarquee();
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased`} suppressHydrationWarning>
        {/* Структурированные данные для SEO (Organization) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "The Ame",
              url: "https://theame.ru/",
              logo: "https://theame.ru/android-chrome-512x512.png",
              sameAs: [
                // Здесь можно добавить ссылки на соцсети
              ],
            }),
          }}
        />
        {/* Структурированные данные для SEO (WebSite) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "The Ame",
              alternateName: ["TheAme"],
              url: "https://theame.ru/",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://theame.ru/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* Основная структура: AppShell с провайдерами + контент */}
        <AppShell initialMarquee={marquee}>{children}</AppShell>
      </body>
    </html>
  );
}
