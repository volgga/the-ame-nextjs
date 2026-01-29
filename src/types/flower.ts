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
  slug?: string | null;         // <— слаг товара

  inStock: boolean;
  quantity: number;
  colors: string[];
  size: 'small' | 'medium' | 'large';
  occasion: string[];
}

export interface CartItem extends Flower {
  cartQuantity: number;
}

export type FlowerCategory =
  | 'roses'
  | 'tulips'
  | 'peonies'
  | 'sunflowers'
  | 'lavender'
  | 'mixed';
