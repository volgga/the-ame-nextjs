import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { RecommendSection } from "@/components/home/RecommendSection";
import { ProgressiveBelowFold } from "@/components/home/ProgressiveBelowFold";
import { HomeCategoryTiles } from "@/components/home/HomeCategoryTiles";
import { AboutSection } from "@/components/home/AboutSection";
import { OrderBouquetSection } from "@/components/home/OrderBouquetSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { FaqSection } from "@/components/home/FaqSection";
import { getActiveHeroSlides } from "@/lib/heroSlides";

const MapSection = dynamic(
  () => import("@/components/home/MapSection").then((m) => ({ default: m.MapSection })),
  { ssr: true }
);
import { getAllCatalogProducts } from "@/lib/products";
import { getRecommendProducts } from "@/lib/catalogCategories";
import { getActiveHomeCollections } from "@/lib/homeCollections";
import { getHomeReviews } from "@/lib/homeReviews";
import { getHomeAbout } from "@/lib/homeAbout";
import { getHomeFaq } from "@/lib/homeFaq";
import { getHomeOrderBlock } from "@/lib/homeOrderBlock";
import { getPublishedPosts } from "@/lib/blog";
import { CANONICAL_BASE, SITE_NAME, LOCALE, ROBOTS_INDEX_FOLLOW, canonicalUrl } from "@/lib/seo";
import { BlogSlider } from "@/components/home/BlogSlider";

const HOME_TITLE = "Доставка цветов в Сочи — купить цветы в цветочном магазине The Ame";
const HOME_DESCRIPTION =
  "Купить цветы с доставкой в Сочи — розы, монобукеты и авторские букеты. Быстрая доставка, свежие цветы и удобный заказ в The Ame.";
const HOME_KEYWORDS =
  "доставка цветов сочи, цветы сочи, купить цветы сочи, букеты с доставкой, розы сочи, монобукеты сочи, доставка букетов";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  keywords: HOME_KEYWORDS,
  alternates: {
    canonical: canonicalUrl("/"),
  },
  robots: ROBOTS_INDEX_FOLLOW,
  openGraph: {
    type: "website",
    locale: LOCALE,
    url: canonicalUrl("/"),
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [{ url: `${CANONICAL_BASE}/IMG_4256.JPG`, width: 1200, height: 630, alt: HOME_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [`${CANONICAL_BASE}/IMG_4256.JPG`],
  },
};

/**
 * Главная страница: hero → «Рекомендуем» → «КОЛЛЕКЦИИ THE ÁME» → «О нас» → «Заказать букет» → «Часто задаваемые вопросы» → «Отзывы клиентов» → «Карта».
 */
export default async function HomePage() {
  const [slides, allProducts, homeCollections, homeReviews, homeAbout, homeFaq, homeOrderBlock, blogPosts] =
    await Promise.all([
      getActiveHeroSlides(),
      getAllCatalogProducts(),
      getActiveHomeCollections(),
      getHomeReviews(),
      getHomeAbout(),
      getHomeFaq(),
      getHomeOrderBlock(),
      getPublishedPosts(),
    ]);

  const { products: recommendProducts } = getRecommendProducts(allProducts);

  // LCP: прелоад первого hero-изображения (серверный вывод — браузер начинает загрузку до гидрации)
  const firstHeroImageUrl = slides[0]?.imageUrl;

  return (
    <div className="min-h-screen bg-page-bg">
      {firstHeroImageUrl ? (
        <link rel="preload" as="image" href={firstHeroImageUrl} />
      ) : null}
      <HeroCarousel slides={slides} />
      <RecommendSection products={recommendProducts} />
      <ProgressiveBelowFold>
        <HomeCategoryTiles collections={homeCollections} />
        <AboutSection about={homeAbout} />
        <OrderBouquetSection
          title={homeOrderBlock?.title}
          subtitle1={homeOrderBlock?.subtitle1}
          text={homeOrderBlock?.text}
          imageUrl={homeOrderBlock?.imageUrl}
        />
        <FaqSection faqItems={homeFaq} />
        <ReviewsSection reviews={homeReviews} />
        <MapSection />
        <BlogSlider posts={blogPosts.slice(0, 6)} />
      </ProgressiveBelowFold>
    </div>
  );
}
