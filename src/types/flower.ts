// src/types/flower.ts

export interface Flower {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;

  // как и раньше — строка, ничего не ломаем
  category: string;

  // новые поля для ЧПУ
  categoryId?: string | null;
  categorySlug?: string | null; // <— слаг категории
  slug?: string | null; // <— слаг товара

  inStock: boolean;
  quantity: number;
  colors: string[];
  size: "small" | "medium" | "large";
  occasion: string[];
  /** Если true — на витрине вместо цены показывается «Предзаказ» */
  isPreorder?: boolean;
  /** Для вариантных товаров: показывать "от {price} ₽" */
  priceFrom?: boolean;
}

export interface CartItem extends Flower {
  cartQuantity: number;
  /** Id варианта (для вариантных товаров); вместе с id товара образует уникальную строку корзины */
  variantId?: number | null;
  /** Человекочитаемое название варианта (выводим в корзине и в TG) */
  variantTitle?: string | null;
}

/** Id строки в корзине: productId или productId__variantId */
export function getCartLineId(item: Pick<Flower, "id"> & { variantId?: number | null }): string {
  return item.variantId != null ? `${item.id}__${item.variantId}` : item.id;
}
