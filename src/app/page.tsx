import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { RecommendSection } from "@/components/home/RecommendSection";
import { HomeCategoryTiles } from "@/components/home/HomeCategoryTiles";
import { getActiveHeroSlides } from "@/lib/heroSlides";
import { getAllCatalogProducts } from "@/lib/products";
import { getRecommendProducts } from "@/lib/catalogCategories";
import { getActiveHomeCollections } from "@/lib/homeCollections";

/**
 * Главная страница: hero → «Рекомендуем» → «КОЛЛЕКЦИИ THE ÁME» (заголовок + сетка карточек).
 */
export default async function HomePage() {
  const [slides, allProducts, homeCollections] = await Promise.all([
    getActiveHeroSlides(),
    getAllCatalogProducts(),
    getActiveHomeCollections(),
  ]);

  const { products: recommendProducts } = getRecommendProducts(allProducts);

  return (
    <div className="min-h-screen bg-page-bg">
      <HeroCarousel slides={slides} />
      <RecommendSection products={recommendProducts} />
      <HomeCategoryTiles collections={homeCollections} />
    </div>
  );
}
