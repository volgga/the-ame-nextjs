import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/app/AppShell";
import { YandexMetrikaHitTracker } from "@/components/analytics/YandexMetrika";
import { CANONICAL_BASE, SITE_NAME, LOCALE } from "@/lib/seo";
import { getHomeMarquee } from "@/lib/homeMarquee";

/** Schema.org JSON-LD: Organization, Florist, Service, WebSite — один глобальный блок в layout */
const SCHEMA_ORG_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${CANONICAL_BASE}/#organization`,
    name: SITE_NAME,
    url: CANONICAL_BASE,
    logo: `${CANONICAL_BASE}/1000x1000.png`,
    telephone: "+79939326095",
    email: "theame123@mail.ru",
    sameAs: [
      "https://api.whatsapp.com/message/XQDDWGSEL35LP1?autoload=1&app_absent=0",
      "https://t.me/the_ame_flowers",
      "https://t.me/theame123",
      "https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY",
      "https://www.instagram.com/theame.flowers",
    ],
  },
  {
    "@type": "Florist",
    "@id": `${CANONICAL_BASE}/#florist`,
    name: SITE_NAME,
    url: CANONICAL_BASE,
    telephone: "+79939326095",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "RU",
      addressRegion: "Краснодарский край",
      addressLocality: "Сочи",
      streetAddress: "улица Пластунская 123А, корпус 2, этаж 2, офис 84",
    },
    areaServed: [
      { "@type": "City", name: "Сочи" },
      { "@type": "City", name: "Адлер" },
      { "@type": "City", name: "Сириус" },
      { "@type": "Place", name: "Красная Поляна" },
      { "@type": "Place", name: "Хоста" },
      { "@type": "Place", name: "Дагомыс" },
      { "@type": "Place", name: "Мацеста" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "21:00",
      },
    ],
    description:
      "Цветочный магазин The Ame в Сочи. Приём заказов ежедневно с 09:00 до 21:00. Круглосуточная доставка букетов по Сочи и районам.",
  },
  {
    "@type": "Service",
    "@id": `${CANONICAL_BASE}/#delivery`,
    name: "Доставка цветов в Сочи",
    serviceType: "Flower delivery",
    provider: { "@id": `${CANONICAL_BASE}/#florist` },
    areaServed: [
      { "@type": "City", name: "Сочи" },
      { "@type": "City", name: "Адлер" },
      { "@type": "City", name: "Сириус" },
      { "@type": "Place", name: "Красная Поляна" },
      { "@type": "Place", name: "Хоста" },
      { "@type": "Place", name: "Дагомыс" },
      { "@type": "Place", name: "Мацеста" },
    ],
    availableChannel: [
      {
        "@type": "ServiceChannel",
        serviceUrl: "https://api.whatsapp.com/message/XQDDWGSEL35LP1?autoload=1&app_absent=0",
      },
      { "@type": "ServiceChannel", serviceUrl: "https://t.me/the_ame_flowers" },
    ],
  },
  {
    "@type": "WebSite",
    "@id": `${CANONICAL_BASE}/#website`,
    url: CANONICAL_BASE,
    name: SITE_NAME,
    potentialAction: {
      "@type": "SearchAction",
      target: `${CANONICAL_BASE}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
] as const;

/** Код счётчика Яндекс.Метрики — как можно ближе к началу страницы (официальный сниппет). */
const YANDEX_METRIKA_INLINE = `
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=103806735", "ym");
ym(103806735, "init", {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
`.trim();

// Подключаем шрифт Montserrat (как в старом проекте)
// next/font/google автоматически добавляет preload для шрифта
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
  adjustFontFallback: true, // Снижает CLS при загрузке шрифта
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
    title: "Купить цветы в Сочи с доставкой | The Ame",
    description: "Свежие букеты и доставка цветов по Сочи. Авторские композиции, розы, монобукеты.",
    url: "https://theame.ru",
    images: [{ url: "/og-main.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Купить цветы в Сочи с доставкой | The Ame",
    description: "Свежие букеты и доставка цветов по Сочи. Авторские композиции, розы, монобукеты.",
    images: ["https://theame.ru/og-main.jpg"],
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
        {/* Контейнер dataLayer для e-commerce: создаём до загрузки счётчика и любых push.
            Доки: https://yandex.ru/support/metrica/data/e-commerce.html */}
        <Script
          id="yandex-metrika-datalayer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: "window.dataLayer = window.dataLayer || [];" }}
        />
        {/* Яндекс.Метрика — загружаем через next/script после интерактивности для уменьшения блокировки рендера.
            ⚠️ После деплоя проверить, что аналитика работает корректно (первые события могут не учитываться). */}
        <Script
          id="yandex-metrika"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: YANDEX_METRIKA_INLINE }}
        />
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/103806735"
              style={{ position: "absolute", left: -9999 }}
              alt=""
            />
          </div>
        </noscript>
        {/* Schema.org: Organization, Florist, Service, WebSite — один глобальный JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORG_JSON_LD) }}
        />

        <YandexMetrikaHitTracker />

        {/* Основная структура: AppShell с провайдерами + контент */}
        <AppShell initialMarquee={marquee}>{children}</AppShell>
      </body>
    </html>
  );
}
