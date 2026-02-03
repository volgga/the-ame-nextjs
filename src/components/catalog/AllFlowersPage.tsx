import { Suspense } from "react";
import { Breadcrumbs, SECTION_GAP } from "@/components/ui/breadcrumbs";
import { CategoryChips } from "@/components/catalog/category-chips";
import { ProductToolbar } from "@/components/catalog/product-toolbar";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { getAllCatalogProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { ALL_CATALOG } from "@/lib/catalogCategories";

export type AllFlowersPageProps = {
  /** Заголовок страницы (H1) */
  title: string;
  /** SEO/описательный текст под заголовком */
  description: string;
  /** Текст в хлебных крошках для этой страницы (если showBreadcrumbs true) */
  breadcrumbLabel: string;
  /** Показывать хлебные крошки. По умолчанию true. Для страницы "Все цветы" — false */
  showBreadcrumbs?: boolean;
  /** Текущий роут для подсветки чипа: null = активен "Все цветы", "magazin" = ни один не активен, иначе slug категории */
  currentSlug?: string | null;
};

/**
 * Общая разметка и логика страницы «все товары каталога».
 * Используется для /posmotret-vse-tsvety (Все цветы) и /magazin (Каталог).
 */
export async function AllFlowersPage({
  title,
  description,
  breadcrumbLabel,
  showBreadcrumbs = true,
  currentSlug = null,
}: AllFlowersPageProps) {
  const [categories, products] = await Promise.all([getCategories(), getAllCatalogProducts()]);

  const priceBounds = (() => {
    const prices = products.map((p) => p.price).filter(Number.isFinite);
    if (!prices.length) return [0, 10000] as [number, number];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return [min, Math.max(max, min + 1)] as [number, number];
  })();

  const breadcrumbItems = [{ label: "Главная", href: "/" }, { label: breadcrumbLabel }];

  const chips = [
    { slug: "", name: ALL_CATALOG.title, isAll: true },
    ...categories
      .filter((c) => c.slug !== "posmotret-vse-tsvety" && c.slug !== "magazin")
      .map((c) => ({ slug: c.slug, name: c.name, isAll: false })),
  ];

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container px-6 pt-3 pb-8 md:pt-4 md:pb-10">
        {showBreadcrumbs && <Breadcrumbs items={breadcrumbItems} />}

        <div className={`grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 md:gap-8 md:items-start ${SECTION_GAP}`}>
          <h1 className="text-2xl md:text-4xl lg:text-[2.5rem] font-bold text-color-text-main uppercase tracking-tight">
            {title}
          </h1>
          <div className="max-h-[96px] md:max-h-[120px] overflow-y-auto mt-3 md:mt-0">
            <p className="text-base md:text-[15px] leading-relaxed text-color-text-secondary">{description}</p>
          </div>
        </div>

        <div className={SECTION_GAP}>
          <CategoryChips categories={chips} currentSlug={currentSlug ?? null} />
        </div>

        <div className={SECTION_GAP}>
          <Suspense fallback={<div className="h-10" />}>
            <ProductToolbar priceBounds={priceBounds} />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-color-text-secondary">
              Загрузка каталога…
            </div>
          }
        >
          <FlowerCatalog products={products} />
        </Suspense>
      </div>
    </div>
  );
}
