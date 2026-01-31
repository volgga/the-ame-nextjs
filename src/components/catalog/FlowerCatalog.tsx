"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FlowerCard } from "./FlowerCard";
import { Flower } from "@/types/flower";
import type { Product } from "@/lib/products";

/**
 * FlowerCatalog — каталог товаров. Данные приходят с сервера из Supabase (таблица products).
 * categoryTitle — заголовок страницы (например для /catalog/avtorskie-bukety).
 */
type FlowerCatalogProps = {
  products: Product[];
  categoryTitle?: string;
};

export const FlowerCatalog = ({ products: allProducts, categoryTitle }: FlowerCatalogProps) => {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "";

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  // Преобразуем Product[] в Flower[]
  const flowers: Flower[] = useMemo(
    () =>
      allProducts.map((p) => ({
        id: p.id,
        name: p.title,
        price: p.price,
        image: p.image,
        description: p.shortDescription,
        category: "Разное",
        inStock: true,
        quantity: 1,
        colors: [],
        size: "medium",
        occasion: [],
        slug: p.slug,
        categorySlug: null,
      })),
    [allProducts]
  );

  // Фильтрация по категории (пока упрощённо)
  const filteredFlowers = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;

    return flowers.filter((flower) => {
      // Фильтр по цене
      const price = flower.price ?? 0;
      if (!(price >= minPrice && price <= maxPrice)) return false;

      // Фильтр по категории (если есть параметр)
      if (categoryParam) {
        // Пока просто пропускаем все, позже добавим реальную фильтрацию
      }

      return true;
    });
  }, [flowers, priceRange, categoryParam]);

  // Границы цен
  const absolutePriceBounds = useMemo(() => {
    const prices = flowers.map((f) => f.price ?? 0);
    if (!prices.length) return [0, 10000];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return [min, Math.max(max, min)];
  }, [flowers]);

  useEffect(() => {
    setPriceRange([absolutePriceBounds[0], absolutePriceBounds[1]]);
  }, [absolutePriceBounds[0], absolutePriceBounds[1]]);

  // Сортировка
  const sortedFlowers = useMemo(() => {
    const arr = [...filteredFlowers];
    if (sortBy === "price-asc") {
      return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    }
    if (sortBy === "price-desc") {
      return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    return arr;
  }, [filteredFlowers, sortBy]);

  return (
    <div className="container px-6 py-8">
      {/* Заголовок */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
          {categoryTitle ?? "Каталог цветов и букетов"}
        </h1>
      </div>

      {/* Фильтры и сортировка (упрощённая версия) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Сортировка */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "default" | "price-asc" | "price-desc")}
          className="min-w-[220px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="default">По умолчанию</option>
          <option value="price-asc">По возрастанию цены</option>
          <option value="price-desc">По убыванию цены</option>
        </select>
      </div>

      {/* Каталог */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {sortedFlowers.map((flower) => (
          <FlowerCard key={flower.id} flower={flower} />
        ))}
      </div>

      {/* Пустой результат */}
      {sortedFlowers.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg text-muted-foreground">Цветы не найдены</p>
          <button
            onClick={() => {
              setPriceRange([absolutePriceBounds[0], absolutePriceBounds[1]]);
              setSortBy("default");
            }}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {/* SEO-текст внизу каталога */}
      <div className="mt-12 bg-white p-6 md:p-10 rounded-lg shadow-soft text-[#7e7e7e]">
        <h2 className="text-2xl font-semibold mb-4 text-[#000]">
          Почему выбирают The Ame для заказа цветов и букетов в Сочи
        </h2>

        <p className="text-base">
          The Ame — это современный цветочный магазин, где качество и вкус всегда на первом месте.
          Мы предлагаем только свежие цветы от проверенных поставщиков, чтобы каждый букет
          выглядел безупречно. Здесь вы можете купить цветы в Сочи для любого повода — от
          искреннего «спасибо» до значимого праздника. Наши флористы создают авторские и
          вау-букеты, подчеркивающие стиль и настроение момента.
        </p>

        <p className="text-base mt-4">
          Мы заботимся о том, чтобы подарок был цельным и продуманным. В ассортименте — не только
          букеты, но и вазы, мягкие игрушки, шары, ароматические свечи, а также подарочные корзины
          со сладостями и фруктами. Всё это можно дополнить к цветам, чтобы сделать сюрприз
          по-настоящему тёплым и запоминающимся.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3 text-[#000]">
          Что можно заказать в каталоге The Ame
        </h3>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            Монобукеты из роз, пионов, хризантем, гортензий, тюльпанов, ромашек, альстромерий и
            лилий.
          </li>
          <li>Авторские букеты и премиум-композиции с сезонными цветами.</li>
          <li>Маленькие букеты для повседневных подарков.</li>
          <li>Объёмные букеты и шляпные коробки для особых случаев.</li>
          <li>Корзины с фруктами и сладостями, подарочные наборы, свечи и вазы.</li>
          <li>Сезонные коллекции — весенние, летние, осенние и зимние.</li>
        </ul>

        <p className="mt-8 text-base">
          Мы осуществляем доставку цветов по всему Сочи: Центр, Адлер, Хоста, Сириус, Лоо, Мацеста,
          Дагомыс, Красная Поляна и другие районы. Оформите заказ онлайн в два клика, и мы соберём
          ваш букет с любовью, аккуратно упакуем и доставим точно в срок — чтобы каждый момент стал
          особенным.
        </p>
      </div>
    </div>
  );
};
