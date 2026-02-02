import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { RecommendSection } from "@/components/home/RecommendSection";
import { HomeCategoryTiles } from "@/components/home/HomeCategoryTiles";
import { getActiveHeroSlides } from "@/lib/heroSlides";
import { getAllCatalogProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { getRecommendProducts } from "@/lib/catalogCategories";
import { getHomeCategoriesOrdered } from "@/lib/homeCategoryImages";

/**
 * Главная страница: hero-слайды → «Рекомендуем» (лента из «Популярное») → плитка категорий.
 */
export default async function HomePage() {
  const [slides, allProducts, allCategories] = await Promise.all([
    getActiveHeroSlides(),
    getAllCatalogProducts(),
    getCategories(),
  ]);

  const { products: recommendProducts, usedSlug } = getRecommendProducts(allProducts);

  // Лог для отладки блока «Рекомендуем» (server console)
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[HomePage] Рекомендуем:", {
      totalProducts: allProducts.length,
      usedSlug: usedSlug ?? "(нет совпадений по slug)",
      recommendCount: recommendProducts.length,
    });
  }

  const homeCategories = getHomeCategoriesOrdered(allCategories);

  return (
    <div className="min-h-screen bg-page-bg">
      <HeroCarousel slides={slides} />
      <RecommendSection products={recommendProducts} />
      <HomeCategoryTiles categories={homeCategories} />
    </div>
  );
}
