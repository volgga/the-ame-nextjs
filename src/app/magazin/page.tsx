import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";
import { getCategories, getCategoryBySlug } from "@/lib/categories";
import {
  canonicalUrl,
  trimDescription,
  normalizeCategoryNameForTitle,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  hasIndexableQueryParams,
} from "@/lib/seo";

const FALLBACK_TITLE = "Каталог";
const FALLBACK_DESCRIPTION =
  "Все цветы The Áme — аккуратные букеты и гармоничные композиции для любого повода. Идеальный выбор, чтобы порадовать близких, создать настроение и подарить эмоции без лишних слов.";

type MagazinPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: MagazinPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const categories = await getCategories();
  const cat = getCategoryBySlug(categories, "magazin");
  const name = cat?.name ?? FALLBACK_TITLE;
  const normalizedName = normalizeCategoryNameForTitle(name);
  const title =
    normalizedName.toLowerCase().includes("сочи") || normalizedName.toLowerCase().includes("доставка")
      ? `${normalizedName} | The Ame`
      : `Купить ${normalizedName} в Сочи с доставкой | The Ame`;
  const descRaw = cat?.description?.trim() ?? FALLBACK_DESCRIPTION;
  const description = trimDescription(descRaw, 160) || FALLBACK_DESCRIPTION;
  const hasParams = hasIndexableQueryParams(resolvedSearchParams);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl("/magazin") },
    robots: hasParams ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
  };
}

export default async function MagazinPage() {
  const categories = await getCategories();
  const cat = getCategoryBySlug(categories, "magazin");
  const title = cat?.name ?? FALLBACK_TITLE;
  const description = cat?.description?.trim() ?? FALLBACK_DESCRIPTION;
  return (
    <AllFlowersPage
      title={title}
      description={description}
      breadcrumbLabel={title}
      currentSlug="magazin"
    />
  );
}
