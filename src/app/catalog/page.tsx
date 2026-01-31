import type { Metadata } from "next";
import { Suspense } from "react";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { getAllCatalogProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Каталог букетов",
  description:
    "Каталог The Ame: свежие букеты, монобукеты и композиции в коробках. Розы, гортензии, хризантемы — доставка по Сочи от 45 минут.",
  alternates: {
    canonical: "https://theame.ru/catalog",
  },
};

export default async function CatalogPage() {
  const products = await getAllCatalogProducts();
  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-[#7e7e7e]">Загрузка каталога…</div>}>
        <FlowerCatalog products={products} />
      </Suspense>
    </div>
  );
}
