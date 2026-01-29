import type { Metadata } from "next";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";

export const metadata: Metadata = {
  title: "Каталог букетов",
  description:
    "Каталог The Ame: свежие букеты, монобукеты и композиции в коробках. Розы, гортензии, хризантемы — доставка по Сочи от 45 минут.",
  alternates: {
    canonical: "https://theame.ru/catalog",
  },
};

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <FlowerCatalog />
    </div>
  );
}
