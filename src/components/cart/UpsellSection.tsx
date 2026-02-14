"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Flower } from "@/types/flower";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

type AddOnProductItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
};

type AddOnGroup = {
  categorySlug: string;
  categoryName: string;
  products: AddOnProductItem[];
};

/**
 * UpsellSection — блок доп.товаров под суммой заказа.
 * Одна общая лента карточек (порядок из API: группы подряд, без табов).
 */
export function UpsellSection() {
  const { addAddonToCart, isAddonInCart } = useCart();
  const [groups, setGroups] = useState<AddOnGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch("/api/add-on-products")
      .then((res) => {
        if (cancelled) return res;
        if (!res.ok) {
          setError(true);
          return res.json().catch(() => ({}));
        }
        return res.json();
      })
      .then((data: { groups?: AddOnGroup[] }) => {
        if (cancelled) return;
        const list = Array.isArray(data.groups) ? data.groups : [];
        setGroups(list);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setGroups([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollBy = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = 320;
    const delta = direction === "left" ? -step : step;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const handleAddAddon = (addon: AddOnProductItem) => {
    const flower: Flower = {
      id: addon.id,
      name: addon.title,
      price: addon.price,
      image: addon.image,
      description: "",
      category: "Дополнительно",
      inStock: true,
      quantity: 1,
      colors: [],
      size: "medium",
      occasion: [],
    };
    addAddonToCart(flower);
  };

  const extraItems = groups.flatMap((g) => g.products);

  if (loading) {
    return (
      <div className="pt-4 border-t">
        <h3 className="text-base font-semibold mb-4">Добавить к заказу?</h3>
        <div className="h-32 rounded-lg bg-gray-100 animate-pulse" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-4 border-t">
        <h3 className="text-base font-semibold mb-4">Добавить к заказу?</h3>
        <p className="text-sm text-muted-foreground">Не удалось загрузить рекомендации.</p>
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div className="pt-4 border-t">
      <h3 className="text-base font-semibold mb-4">Добавить к заказу?</h3>

      {extraItems.length > 0 && (
        <div className="relative flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => scrollBy("left")}
            aria-label="Прокрутить влево"
            className="flex-shrink-0 self-center w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide flex-1 min-w-0"
            style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
          >
            {extraItems.map((addon) => {
              const inCart = isAddonInCart(addon.id);
              return (
                <div
                  key={addon.id}
                  className="flex-shrink-0 w-[140px] md:w-[160px] border border-gray-200 rounded-lg p-3 bg-white"
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#ece9e2] mb-2">
                    <Image
                      src={addon.image?.trim() || PLACEHOLDER_IMAGE}
                      alt={addon.title}
                      fill
                      sizes="160px"
                      quality={75}
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-sm font-medium mb-1 line-clamp-2">{addon.title}</h4>
                  <p className="text-sm font-semibold text-gray-900 mb-2">{addon.price.toLocaleString("ru-RU")} ₽</p>
                  <button
                    type="button"
                    onClick={() => handleAddAddon(addon)}
                    disabled={inCart}
                    className={`w-full py-2 px-3 rounded-full text-xs font-medium transition-colors ${
                      inCart
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-accent-btn hover:bg-accent-btn-hover text-white"
                    }`}
                  >
                    {inCart ? "Добавлено" : "Добавить"}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollBy("right")}
            aria-label="Прокрутить вправо"
            className="flex-shrink-0 self-center w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
