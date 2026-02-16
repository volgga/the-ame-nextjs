import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";
import { getCategories, getCategoryBySlug } from "@/lib/categories";
import {
  canonicalUrl,
  truncateDescription,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  hasIndexableQueryParams,
  SITE_NAME,
  LOCALE,
  CANONICAL_BASE,
} from "@/lib/seo";

export const revalidate = 300;

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
  // Каталог (magazin): фиксированный title по ТЗ
  const title = "Купить цветы в Сочи — букеты с доставкой | The Ame";
  // Если есть описание категории → использовать его (нормализованное и обрезанное до ≤160 символов)
  // Иначе fallback
  const description =
    cat?.description && cat.description.trim().length > 0
      ? truncateDescription(cat.description, 160)
      : FALLBACK_DESCRIPTION;
  const hasParams = hasIndexableQueryParams(resolvedSearchParams);

  const url = canonicalUrl("/magazin");
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: hasParams ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
    openGraph: {
      type: "website",
      locale: LOCALE,
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: `${CANONICAL_BASE}/IMG_1543.PNG`, width: 900, height: 1200, alt: title }],
    },
  };
}

export default async function MagazinPage({ searchParams }: MagazinPageProps) {
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
      searchParams={searchParams}
    />
  );
}
