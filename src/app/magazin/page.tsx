import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";
import { getCategories, getCategoryBySlug } from "@/lib/categories";
import {
  canonicalUrl,
  truncateDescription,
  normalizeCategoryNameForTitle,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  hasIndexableQueryParams,
  SITE_NAME,
  LOCALE,
  CANONICAL_BASE,
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
  // Формула по спеке: "Купить {НазваниеКатегории} в Сочи с доставкой | The Ame"
  const lowerName = normalizedName.toLowerCase();
  const hasSochi = lowerName.includes("сочи");
  const hasDelivery = lowerName.includes("доставка");
  const title = hasSochi || hasDelivery
    ? `${normalizedName} | The Ame`
    : `Купить ${normalizedName} в Сочи с доставкой | The Ame`;
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
