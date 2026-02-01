import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/app/providers";
import { FloatingSocialButton } from "@/components/FloatingSocialButton";
import { CookieConsent } from "@/components/common/CookieConsent";

// Подключаем шрифт Montserrat (как в старом проекте)
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  // Шаблон для title (будет использоваться на всех страницах)
  title: {
    template: "%s | The Ame",
    default: "The Ame — премиальные букеты в Сочи",
  },
  description:
    "Премиальные букеты, свежие цветы и идеальный сервис. Закажите доставку по Сочи от 45 минут — создаём настроение в каждом букете.",
  keywords: [
    "купить цветы Сочи",
    "доставка цветов Сочи",
    "свежие букеты",
    "премиум букеты",
    "авторские композиции",
    "розы с доставкой",
    "пионовидные розы",
    "сезонные цветы",
    "цветы онлайн",
    "цветы в подарок",
  ],
  authors: [{ name: "The Ame" }],
  creator: "The Ame",
  publisher: "The Ame",
  applicationName: "The Ame",
  // Open Graph метаданные (для соцсетей)
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://theame.ru/",
    siteName: "The Ame",
    title: "The Ame — премиальные букеты в Сочи",
    description:
      "Премиальные букеты, свежие цветы и идеальный сервис. Закажите доставку по Сочи от 45 минут — создаём настроение в каждом букете.",
    images: [
      {
        url: "https://theame.ru/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Ame — премиальные букеты в Сочи",
      },
    ],
  },
  // Twitter метаданные
  twitter: {
    card: "summary_large_image",
    title: "The Ame — премиальные букеты в Сочи",
    description:
      "Премиальные букеты, свежие цветы и идеальный сервис. Закажите доставку по Сочи от 45 минут.",
    images: ["https://theame.ru/og-image.jpg"],
  },
  // Иконки (favicon)
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  // Другие метаданные
  manifest: "/site.webmanifest",
  // themeColor в Next 16 нужно указывать через export const viewport (см. ниже)
  // Canonical URL (будет переопределяться на каждой странице)
  alternates: {
    canonical: "https://theame.ru/",
  },
  // Robots (для поисковых систем)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${montserrat.variable} antialiased`}>
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

        {/* Основная структура: Header + контент + Footer */}
        <Providers>
          <div className="min-h-screen flex flex-col bg-white">
            <Header />
            <main className="flex-1 bg-white">{children}</main>
            <Footer />
            {/* Плавающая кнопка соцсетей */}
            <FloatingSocialButton />
            <CookieConsent />
          </div>
        </Providers>
      </body>
    </html>
  );
}
