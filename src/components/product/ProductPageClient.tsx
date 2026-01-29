"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/products";
import { Flower } from "@/types/flower";

type ProductPageClientProps = {
  product: Product;
};

export function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();

  // Преобразуем Product в Flower для корзины
  const flower: Flower = {
    id: product.id,
    name: product.title,
    price: product.price,
    image: product.image,
    description: product.shortDescription,
    category: "Разное",
    inStock: true,
    quantity: 1,
    colors: [],
    size: "medium",
    occasion: [],
    slug: product.slug,
    categorySlug: null,
  };

  const images = [product.image];
  const imagesLen = images.length || 1;

  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % imagesLen);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + imagesLen) % imagesLen);

  const handleAddToCart = () => {
    addToCart(flower);
    // TODO: добавить toast уведомления
  };

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-center">
          {/* Галерея */}
          <div className="space-y-4">
            <div
              className="
                relative overflow-hidden
                aspect-square
                w-full max-w-[620px]
                mx-auto rounded-lg
                bg-white
              "
            >
              <Image
                src={images[selectedImageIndex] || product.image}
                alt={product.title}
                fill
                className="object-contain object-center"
                priority
              />

              {imagesLen > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-md p-2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-md p-2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {imagesLen > 1 && (
              <div className="flex justify-center gap-2 flex-wrap">
                {images.map((src, idx) => (
                  <div
                    key={src + idx}
                    className={`cursor-pointer overflow-hidden aspect-square h-16 md:h-20 rounded-md transition-all ${
                      selectedImageIndex === idx
                        ? "ring-2 ring-primary"
                        : "hover:ring-1 hover:ring-muted-foreground"
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <Image
                      src={src}
                      alt={`${product.title} ${idx + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Инфо */}
          <div className="space-y-6 lg:self-center lg:max-w-[560px] lg:mx-auto">
            {/* Название */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#819570]">
              {product.title.toUpperCase()}
            </h1>

            {/* Цена под названием */}
            <div className="text-2xl font-bold text-[#819570]">
              {product.price.toLocaleString("ru-RU")} ₽
            </div>

            {/* Кнопка + сердечко */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="h-12 rounded-full px-8 text-base font-medium bg-[#819570] hover:bg-[#6f7f5f] text-white transition-colors flex items-center gap-2"
              >
                <ShoppingBag className="w-6 h-6" />
                Добавить в корзину
              </button>

              <button
                type="button"
                aria-label="Добавить в избранное"
                className="h-12 w-12 rounded-full border border-input bg-background hover:bg-accent flex items-center justify-center"
              >
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Описание */}
            {product.shortDescription && (
              <div>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.shortDescription}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
