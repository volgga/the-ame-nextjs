import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";

const MAGAZIN_TITLE = "Каталог";
const MAGAZIN_DESCRIPTION =
  "Все цветы The Áme — аккуратные букеты и гармоничные композиции для любого повода. Идеальный выбор, чтобы порадовать близких, создать настроение и подарить эмоции без лишних слов.";

export const metadata: Metadata = {
  title: `${MAGAZIN_TITLE} | The Ame`,
  description: MAGAZIN_DESCRIPTION,
  alternates: {
    canonical: "https://theame.ru/magazin",
  },
};

export default async function MagazinPage() {
  return (
    <AllFlowersPage
      title={MAGAZIN_TITLE}
      description={MAGAZIN_DESCRIPTION}
      breadcrumbLabel={MAGAZIN_TITLE}
    />
  );
}
