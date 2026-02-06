import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { RecommendSection } from "@/components/home/RecommendSection";
import { HomeCategoryTiles } from "@/components/home/HomeCategoryTiles";
import { AboutSection } from "@/components/home/AboutSection";
import { OrderBouquetSection } from "@/components/home/OrderBouquetSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { FaqSection } from "@/components/home/FaqSection";
import { MapSection } from "@/components/home/MapSection";
import { getActiveHeroSlides } from "@/lib/heroSlides";
import { getAllCatalogProducts } from "@/lib/products";
import { getRecommendProducts } from "@/lib/catalogCategories";
import { getActiveHomeCollections } from "@/lib/homeCollections";
import { getHomeReviews } from "@/lib/homeReviews";
import { getHomeAbout } from "@/lib/homeAbout";
import { getHomeFaq } from "@/lib/homeFaq";
import { getHomeOrderBlock } from "@/lib/homeOrderBlock";

/**
 * Главная страница: hero → «Рекомендуем» → «КОЛЛЕКЦИИ THE ÁME» → «О нас» → «Заказать букет» → «Часто задаваемые вопросы» → «Отзывы клиентов» → «Карта».
 */
export default async function HomePage() {
  const [slides, allProducts, homeCollections, homeReviews, homeAbout, homeFaq, homeOrderBlock] = await Promise.all([
    getActiveHeroSlides(),
    getAllCatalogProducts(),
    getActiveHomeCollections(),
    getHomeReviews(),
    getHomeAbout(),
    getHomeFaq(),
    getHomeOrderBlock(),
  ]);

  const { products: recommendProducts } = getRecommendProducts(allProducts);

  return (
    <div className="min-h-screen bg-page-bg">
      <HeroCarousel slides={slides} />
      <RecommendSection products={recommendProducts} />
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
    </div>
  );
}
