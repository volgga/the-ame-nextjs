import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";
import { getCategories, getCategoryBySlug } from "@/lib/categories";

const FALLBACK_TITLE = "Каталог";
const FALLBACK_DESCRIPTION =
  "Все цветы The Áme — аккуратные букеты и гармоничные композиции для любого повода. Идеальный выбор, чтобы порадовать близких, создать настроение и подарить эмоции без лишних слов.";

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories();
  const cat = getCategoryBySlug(categories, "magazin");
  const title = cat?.name ?? FALLBACK_TITLE;
  const description = cat?.description?.trim() ?? FALLBACK_DESCRIPTION;
  return {
    title: `${title} | The Ame`,
    description,
    alternates: {
      canonical: "https://theame.ru/magazin",
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
