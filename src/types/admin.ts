/**
 * Типы для админки товаров
 * Единый источник правды для форм создания/редактирования
 */

// ============================
// Категории
// ============================

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  description?: string | null;
  sort_order?: number;
}

// ============================
// Изображения
// ============================

/** Изображение для превью в форме (ещё не загружено в Storage) */
export interface ImageDraft {
  file: File;
  previewUrl: string;
}

/** Загруженное изображение из Storage */
export interface UploadedImage {
  url: string;
  path: string;
}

// ============================
// Простой товар (products)
// ============================

/** Строка из таблицы products (для чтения) */
export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  composition_size?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  price: number;
  image_url?: string | null;
  images?: string[] | null;
  is_active: boolean;
  is_hidden: boolean;
  is_preorder: boolean;
  sort_order: number;
  category_slug?: string | null;
  category_slugs?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

/** Payload для создания простого товара (POST /api/admin/products) */
export interface ProductCreatePayload {
  type: "simple";
  name: string;
  slug?: string;
  description?: string;
  composition_size?: string;
  height_cm?: number | null;
  width_cm?: number | null;
  price: number;
  image_url?: string | null;
  images?: string[] | null;
  is_active?: boolean;
  is_hidden?: boolean;
  is_preorder?: boolean;
  category_slugs?: string[] | null;
}

// ============================
// Вариантный товар (variant_products)
// ============================

/** Строка из таблицы variant_products (для чтения). Состав/размер у вариантов, не у основного товара. */
export interface VariantProductRow {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  min_price_cache: number;
  is_active: boolean;
  is_hidden: boolean;
  sort_order: number;
  category_slug?: string | null;
  category_slugs?: string[] | null;
  published_at?: string | null;
}

/** Черновик варианта для формы создания */
export interface VariantDraft {
  id: string; // временный UUID для UI
  name: string;
  composition: string;
  price: number;
  is_preorder: boolean;
  image: ImageDraft | null;
  sort_order: number;
}

/** Payload для одного варианта при создании */
export interface VariantPayload {
  name: string;
  composition?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  price: number;
  is_preorder: boolean;
  image_url?: string | null;
  sort_order: number;
  is_active?: boolean;
}

/** Payload для создания вариантного товара (POST /api/admin/products) */
export interface VariantProductCreatePayload {
  type: "variant";
  name: string;
  slug?: string;
  description?: string;
  image_url?: string | null;
  is_active?: boolean;
  is_hidden?: boolean;
  category_slugs?: string[] | null;
  variants: VariantPayload[];
}

// ============================
// Строка из таблицы product_variants
// ============================

/** Строка из таблицы product_variants (для чтения) */
export interface ProductVariantRow {
  id: number;
  product_id: number;
  title: string; // В БД колонка называется "title"
  composition?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  price: number;
  is_preorder: boolean;
  is_active: boolean;
  sort_order: number;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================
// Общий тип для списка товаров
// ============================

/** Элемент списка товаров (для таблицы в админке) */
export interface ProductListItem {
  id: string;
  type: "simple" | "variant";
  name: string;
  slug: string;
  price: number;
  image_url?: string | null;
  is_active: boolean;
  is_hidden: boolean;
  is_preorder?: boolean;
  sort_order: number;
}

// ============================
// По поводу (Occasions)
// ============================

export interface Occasion {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

// ============================
// Подкатегории (Subcategories)
// ============================

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;
}
