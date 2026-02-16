"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { slugify } from "@/utils/slugify";
import { Modal } from "@/components/ui/modal";
import { parseCompositionFlowers } from "@/lib/parseCompositionFlowers";
import { OCCASIONS_CATEGORY_SLUG } from "@/lib/constants";
import { useAutoSyncCompositionFlowers } from "@/hooks/useAutoSyncCompositionFlowers";
import { BOUQUET_COLORS, filterValidBouquetColorKeys } from "@/shared/catalog/bouquetColors";
import { BouquetColorSwatch } from "@/components/catalog/BouquetColorSwatch";
import { calcPriceFromPercent } from "@/lib/priceUtils";
import { AdminSortableImages, type SortableImageItem } from "@/components/admin/AdminSortableImages";

const FlowersWhitelistModal = dynamic(
  () =>
    import("@/components/admin/products/FlowersWhitelistModal").then((m) => ({ default: m.FlowersWhitelistModal })),
  { ssr: false }
);

const ProductsList = dynamic(
  () => import("@/components/admin/products/ProductsList").then((m) => ({ default: m.ProductsList })),
  {
    loading: () => (
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="h-12 animate-pulse bg-gray-100" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex h-14 border-t border-gray-100">
            <div className="w-14 shrink-0 animate-pulse bg-gray-50" />
            <div className="flex-1 space-y-2 p-3">
              <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-50" />
            </div>
          </div>
        ))}
      </div>
    ),
  }
);

type Product = {
  id: string;
  type: "simple" | "variant";
  name: string;
  slug: string;
  price: number;
  image_url?: string | null;
  is_active: boolean;
  is_hidden: boolean;
  is_preorder?: boolean;
  sort_order?: number;
};

const MAX_IMAGES = 5;
const ALLOWED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif,image/gif";

type ImageItem = { file: File; previewUrl: string };

type Variant = {
  id: string | number; // number = existing, string = new (uuid)
  name: string;
  composition: string;
  height_cm: number | null;
  width_cm: number | null;
  price: number;
  is_preorder: boolean;
  sort_order: number;
  bouquetColors?: string[];
  discountPercent?: number | null;
  discountPrice?: number | null;
  /** Текст "На фото: …" для карточки товара */
  photoLabel?: string | null;
};

const initialForm = {
  name: "",
  description: "",
  composition_size: "",
  height_cm: null as number | null,
  width_cm: null as number | null,
  price: 0,
  discount_percent: null as number | null,
  discount_price: null as number | null,
};

async function readJsonSafe<T = unknown>(
  res: Response
): Promise<{ data: T | null; rawText: string; isJson: boolean }> {
  const rawText = await res.text();
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return { data: JSON.parse(rawText) as T, rawText, isJson: true };
    } catch {
      return { data: null, rawText, isJson: false };
    }
  }
  return { data: null, rawText, isJson: false };
}

function AdminProductsPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<"simple" | "variant">("simple");
  const [createForm, setCreateForm] = useState(initialForm);
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [productImages, setProductImages] = useState<ImageItem[]>([]);
  const [productImagesMainIndex, setProductImagesMainIndex] = useState(0);
  const [productImagesUploading, setProductImagesUploading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; is_active: boolean }[]>([]);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [availableFlowers, setAvailableFlowers] = useState<string[]>([]);
  const [selectedFlowers, setSelectedFlowers] = useState<string[]>([]);
  const [occasionsCategoryId, setOccasionsCategoryId] = useState<string | null>(null);
  const [availableOccasionsSubcategories, setAvailableOccasionsSubcategories] = useState<
    { id: string; name: string; category_id: string }[]
  >([]);
  const [selectedOccasionSubcategoryIds, setSelectedOccasionSubcategoryIds] = useState<string[]>([]);
  const [selectedBouquetColorKeys, setSelectedBouquetColorKeys] = useState<string[]>([]);
  const [loadingOccasions, setLoadingOccasions] = useState(false);
  const [errorOccasions, setErrorOccasions] = useState("");
  const [createIsHidden, setCreateIsHidden] = useState(false);
  const [createIsPreorder, setCreateIsPreorder] = useState(false);
  const [createIsNew, setCreateIsNew] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const productImagesRef = useRef<ImageItem[]>([]);
  productImagesRef.current = productImages;

  // Режим редактирования: id товара или null (создание)
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string | null>(null);

  // Состояние для варианов товара
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantsDraggedIndex, setVariantsDraggedIndex] = useState<number | null>(null);
  // Множество id развернутых вариантов (первый добавленный — развернут по умолчанию)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  // ID вариантов при открытии редактирования (для удаления удалённых в UI)
  const [initialVariantIds, setInitialVariantIds] = useState<number[]>([]);

  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [deleteConfirmProductId, setDeleteConfirmProductId] = useState<string | null>(null);

  // Глобальные детали товаров (Подарок при заказе)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsKit, setDetailsKit] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Модалка управления списком «Цветы в составе» (whitelist для фильтров)
  const [flowersWhitelistModalOpen, setFlowersWhitelistModalOpen] = useState(false);

  // Аккордеоны в форме товара (по умолчанию свернуты)
  const [openOccasions, setOpenOccasions] = useState(false);
  const [openCategories, setOpenCategories] = useState(false);
  const [openBouquetColors, setOpenBouquetColors] = useState(false);

  const isEditMode = editProductId != null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = search ? `/api/admin/products?q=${encodeURIComponent(search)}` : "/api/admin/products";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  // Очистка blob URL при размонтировании (предотвращение утечки памяти)
  useEffect(() => {
    return () => {
      productImagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!createModalOpen) return;
    fetch("/api/admin/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: string; name: string; slug: string; is_active: boolean }[]) =>
        setCategories(data.filter((c) => c.is_active))
      )
      .catch(() => setCategories([]));

    // Загружаем список цветов из справочника flowers (Flower[]), для чекбоксов используем имена
    Promise.all([
      fetch("/api/admin/flowers")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: { name: string }[]) => setAvailableFlowers(Array.isArray(data) ? data.map((f) => f.name) : []))
        .catch(() => setAvailableFlowers([])),
      // Загружаем категорию "По поводу" и её подкатегории
      (async () => {
        try {
          setLoadingOccasions(true);
          setErrorOccasions("");
          // Находим категорию "По поводу" по slug
          const categoriesRes = await fetch("/api/admin/categories");
          if (!categoriesRes.ok) throw new Error("Ошибка загрузки категорий");
          const categories = await categoriesRes.json();
          const occasionsCategory = categories.find((c: { slug: string }) => c.slug === OCCASIONS_CATEGORY_SLUG);
          if (!occasionsCategory) {
            setErrorOccasions(
              'Категория "По поводу" не найдена. Примените миграцию categories-add-occasions-category.sql'
            );
            setLoadingOccasions(false);
            return;
          }
          setOccasionsCategoryId(occasionsCategory.id);
          // Загружаем подкатегории категории "По поводу"
          const subcategoriesRes = await fetch(`/api/admin/subcategories?category_id=${occasionsCategory.id}`);
          if (!subcategoriesRes.ok) throw new Error("Ошибка загрузки подкатегорий");
          const occasionsSubcategories = await subcategoriesRes.json();
          setAvailableOccasionsSubcategories(occasionsSubcategories);
        } catch (e) {
          console.error("[admin/products] Error loading occasions:", e);
          setErrorOccasions(e instanceof Error ? e.message : "Ошибка загрузки");
        } finally {
          setLoadingOccasions(false);
        }
      })(),
    ]);
  }, [createModalOpen]);

  // Открыть модалку при переходе с /admin/products/new или /admin/products?edit=id
  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setEditProductId(null);
      setCreateModalOpen(true);
      window.history.replaceState(null, "", "/admin/products");
    }
    const editId = searchParams.get("edit");
    if (editId) {
      setEditProductId(editId);
      setCreateModalOpen(true);
      window.history.replaceState(null, "", "/admin/products");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!deleteConfirmProductId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteConfirmProductId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [deleteConfirmProductId]);

  async function handleToggleHidden(p: Product) {
    setTogglingProductId(p.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hidden: !p.is_hidden }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Ошибка");
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_hidden: data.is_hidden ?? !p.is_hidden } : x)));
    } catch (e) {
      setError(String(e));
    } finally {
      setTogglingProductId(null);
    }
  }

  async function handleDeleteFromList(id: string) {
    setDeleteConfirmProductId(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Ошибка удаления");
      const next = products.filter((x) => x.id !== id).map((p, i) => ({ ...p, sort_order: i }));
      setProducts(next);
      if (editProductId === id) {
        setEditProductId(null);
        setCreateModalOpen(false);
      }
      if (next.length > 0) {
        const reorderRes = await fetch("/api/admin/products/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: next.map((p, i) => ({ id: p.id, sort_order: i })),
          }),
        });
        if (!reorderRes.ok) {
          const err = await reorderRes.json().catch(() => ({}));
          setError(err?.error ?? "Порядок не обновлён");
          load();
        }
      }
    } catch (e) {
      setError(String(e));
    }
  }

  // Загрузка товара при открытии модалки в режиме редактирования
  useEffect(() => {
    if (!createModalOpen || !editProductId) return;
    let cancelled = false;
    setEditLoading(true);
    setCreateError("");
    fetch(`/api/admin/products/${editProductId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки товара");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const isVariantProduct = data.type === "variant" || String(data.id).startsWith("vp-");
        setCreateType(isVariantProduct ? "variant" : "simple");
        setCreateForm({
          name: data.name ?? "",
          description: data.description ?? "",
          composition_size: isVariantProduct ? "" : (data.composition_size ?? ""),
          height_cm: isVariantProduct ? null : data.height_cm != null ? Number(data.height_cm) : null,
          width_cm: isVariantProduct ? null : data.width_cm != null ? Number(data.width_cm) : null,
          price: Number(data.price ?? data.min_price_cache ?? 0),
          discount_percent: isVariantProduct ? null : (data.discount_percent != null ? Number(data.discount_percent) : null),
          discount_price: isVariantProduct ? null : (data.discount_price != null ? Number(data.discount_price) : null),
        });
        setCreateIsHidden(data.is_hidden ?? false);
        setCreateIsPreorder(data.is_preorder ?? false);
        setCreateIsNew(data.is_new ?? false);
        setSelectedCategorySlugs(
          Array.isArray(data.category_slugs) ? data.category_slugs : data.category_slug ? [data.category_slug] : []
        );
        setSelectedBouquetColorKeys(
          Array.isArray(data.bouquet_colors) ? filterValidBouquetColorKeys(data.bouquet_colors) : []
        );
        // Загружаем выбранные цветы (если есть)
        setSelectedFlowers(
          Array.isArray(data.composition_flowers) && data.composition_flowers.length > 0
            ? data.composition_flowers.filter((f: unknown): f is string => typeof f === "string" && f.length > 0)
            : []
        );
        // Загружаем привязанные подкатегории (включая подкатегории "По поводу")
        // Сначала загружаем категорию "По поводу", если её ещё нет
        const loadSelectedSubcategories = async () => {
          try {
            let categoryId = occasionsCategoryId;
            if (!categoryId) {
              // Загружаем категорию "По поводу" если её ещё нет
              const categoriesRes = await fetch("/api/admin/categories");
              if (categoriesRes.ok) {
                const categories = await categoriesRes.json();
                const occasionsCategory = categories.find((c: { slug: string }) => c.slug === OCCASIONS_CATEGORY_SLUG);
                if (occasionsCategory) {
                  categoryId = occasionsCategory.id;
                  setOccasionsCategoryId(categoryId);
                }
              }
            }
            // Загружаем привязанные подкатегории
            // Для вариантных товаров используем формат "vp-{id}"
            let productIdForSubcategories = editProductId;
            if (isVariantProduct) {
              // Если editProductId это число или строка-число, добавляем префикс "vp-"
              if (typeof editProductId === "string" && /^\d+$/.test(editProductId)) {
                productIdForSubcategories = `vp-${editProductId}`;
              } else if (typeof editProductId === "number") {
                productIdForSubcategories = `vp-${editProductId}`;
              }
              // Если уже есть префикс "vp-", оставляем как есть
            }
            const subcategoriesRes = await fetch(`/api/admin/products/${productIdForSubcategories}/subcategories`);
            if (!subcategoriesRes.ok) throw new Error("Ошибка загрузки подкатегорий");
            const data: { id: string; category_id: string }[] = await subcategoriesRes.json();
            // Фильтруем только подкатегории "По поводу"
            if (categoryId) {
              const occasionsSubcats = data.filter((s) => s.category_id === categoryId);
              setSelectedOccasionSubcategoryIds(occasionsSubcats.map((s) => s.id));
            } else {
              setSelectedOccasionSubcategoryIds([]);
            }
          } catch (e) {
            console.error("[admin/products] Error loading selected subcategories:", e);
            setSelectedOccasionSubcategoryIds([]);
          }
        };
        loadSelectedSubcategories();
        if (isVariantProduct) {
          const main = data.image_url ? [data.image_url] : [];
          const rest = Array.isArray(data.images) ? data.images.filter((u: unknown) => typeof u === "string" && u) : [];
          const all = [...main, ...rest];
          setExistingImageUrls(all);
          setProductImages([]);
          setProductImagesMainIndex(0);
          setExistingMainImageUrl(null);
          const rawVariants = data.variants ?? [];
          setInitialVariantIds(
            rawVariants.map((v: { id?: number }) => v.id).filter((id: unknown): id is number => typeof id === "number")
          );
          const vars = rawVariants.map(
            (
              v: {
                id: number;
                name?: string;
                title?: string;
                size?: string;
                composition?: string;
                height_cm?: number | null;
                width_cm?: number | null;
                price?: number;
                is_preorder?: boolean;
                bouquet_colors?: string[] | null;
                image_url?: string | null;
                image_urls?: string[] | null;
                discount_percent?: number | null;
                discount_price?: number | null;
                photo_label?: string | null;
              },
              idx: number
            ) => {
              return {
                id: v.id,
                name: v.name ?? v.title ?? v.size ?? `Вариант ${idx + 1}`,
                composition: v.composition ?? "",
                height_cm: v.height_cm != null ? Number(v.height_cm) : null,
                width_cm: v.width_cm != null ? Number(v.width_cm) : null,
                price: Number(v.price ?? 0),
                is_preorder: v.is_preorder ?? false,
                sort_order: idx,
                bouquetColors: Array.isArray(v.bouquet_colors) ? filterValidBouquetColorKeys(v.bouquet_colors) : [],
                discountPercent: v.discount_percent != null ? Number(v.discount_percent) : null,
                discountPrice: v.discount_price != null ? Number(v.discount_price) : null,
                photoLabel: v.photo_label?.trim() || null,
              };
            }
          );
          setVariants(vars);
          setExpandedVariants(new Set());
        } else {
          setInitialVariantIds([]);
          setExistingMainImageUrl(null);
          const main = data.image_url ? [data.image_url] : [];
          const rest = Array.isArray(data.images) ? data.images.filter((u: unknown) => typeof u === "string" && u) : [];
          const all = [...main, ...rest];
          setExistingImageUrls(all);
          setProductImages([]);
          setProductImagesMainIndex(0);
        }
      })
      .catch((e) => {
        if (!cancelled) setCreateError(e instanceof Error ? e.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [createModalOpen, editProductId]);

  async function handleDeleteProduct() {
    if (!editProductId) return;
    const confirmed = window.confirm("Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.");
    if (!confirmed) return;
    setDeleteLoading(true);
    setCreateError("");
    try {
      const res = await fetch(`/api/admin/products/${editProductId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Ошибка удаления");
      closeCreateModal();
      load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteLoading(false);
    }
  }

  const closeCreateModal = useCallback(() => {
    productImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setProductImages([]);
    setProductImagesMainIndex(0);
    setExistingImageUrls([]);
    setExistingMainImageUrl(null);
    setEditProductId(null);
    setSelectedCategorySlugs([]);
    setSelectedFlowers([]);
    setSelectedOccasionSubcategoryIds([]);
    setSelectedBouquetColorKeys([]);
    setCreateIsHidden(false);
    setCreateIsPreorder(false);
    setCreateIsNew(false);
    setFieldErrors({});
    setCreateModalOpen(false);
    setCreateForm(initialForm);
    setCreateError("");
    setSelectedFlowers([]);
    setInitialVariantIds([]);
    setVariants([]);
    setExpandedVariants(new Set());
    setExistingMainImageUrl(null);
  }, [productImages, variants]);

  /** Валидация обязательных полей для обычного товара. Возвращает объект с ключами полей и текстами ошибок (пустой — если всё ок). */
  function validateCreateForm(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (createType !== "simple" && createType !== "variant") {
      errors.type = "Выберите тип товара";
    }
    const name = createForm.name.trim();
    if (!name) errors.name = "Введите название";
    const description = createForm.description.trim();
    if (!description) errors.description = "Введите описание";

    if (createType === "simple") {
      const totalImages = existingImageUrls.length + productImages.length;
      if (totalImages === 0) errors.images = "Загрузите хотя бы одно фото";
      if (selectedCategorySlugs.length === 0) errors.categories = "Выберите минимум одну категорию";
      const price = createForm.price;
      if (typeof price !== "number" || price <= 0) errors.price = "Цена должна быть больше 0";
      const discountOn = (createForm.discount_percent != null && createForm.discount_percent > 0) || (createForm.discount_price != null && createForm.discount_price > 0);
      if (discountOn && (createForm.discount_price == null || createForm.discount_price <= 0)) {
        errors.discount_price = "Укажите цену со скидкой";
      }
    }

    if (createType === "variant") {
      const totalImages = existingImageUrls.length + productImages.length;
      if (totalImages === 0) errors.images = "Загрузите хотя бы одно фото";
      if (selectedCategorySlugs.length === 0) errors.categories = "Выберите минимум одну категорию";
      if (variants.length === 0) errors.variants = "Добавьте хотя бы один вариант";

      // Валидация каждого варианта (состав/размер не обязательны, но цена должна быть > 0 всегда)
      variants.forEach((v, idx) => {
        if (!v.name.trim()) errors[`variant_${idx}_name`] = "Введите название варианта";
        if (typeof v.price !== "number" || v.price <= 0) {
          errors[`variant_${idx}_price`] = "Цена должна быть больше 0";
        }
        const variantDiscountOn = (v.discountPercent != null && v.discountPercent > 0) || (v.discountPrice != null && v.discountPrice > 0);
        if (variantDiscountOn && (v.discountPrice == null || v.discountPrice <= 0)) {
          errors[`variant_${idx}_discount_price`] = "Укажите цену со скидкой";
        }
      });
    }

    return errors;
  }

  function toggleCategorySlug(slug: string) {
    setSelectedCategorySlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function toggleFlower(flower: string) {
    setSelectedFlowers((prev) => (prev.includes(flower) ? prev.filter((f) => f !== flower) : [...prev, flower]));
  }

  /** Имена цветов из состава (для сохранения — только существующие в whitelist попадут в привязки). */
  function getFlowerNamesFromComposition(): string[] {
    if (createType === "simple") {
      return parseCompositionFlowers(createForm.composition_size);
    }
    const set = new Set<string>();
    for (const v of variants) {
      for (const name of parseCompositionFlowers(v.composition)) {
        if (name.trim()) set.add(name.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }

  // Автосинхронизация цветов из состава для обычного товара (только когда модалка открыта и тип "simple")
  const { handleFlowerToggle: handleFlowerToggleSimple } = useAutoSyncCompositionFlowers(
    createModalOpen && createType === "simple" ? createForm.composition_size : "",
    availableFlowers,
    selectedFlowers,
    setSelectedFlowers
  );

  // Для вариантных товаров: собираем все составы из всех вариантов
  const variantCompositions = createModalOpen && createType === "variant"
    ? variants.map((v) => v.composition || "").filter((c) => c.trim().length > 0).join(", ")
    : "";

  // Автосинхронизация цветов из состава для вариантного товара
  const { handleFlowerToggle: handleFlowerToggleVariant } = useAutoSyncCompositionFlowers(
    variantCompositions,
    availableFlowers,
    selectedFlowers,
    setSelectedFlowers
  );

  function addProductImages(files: FileList | null) {
    if (!files?.length) return;
    const allowed = Array.from(files).filter((f) => ALLOWED_IMAGE_TYPES.split(",").some((t) => f.type === t.trim()));
    setProductImages((prev) => {
      const currentTotal = existingImageUrls.length + prev.length;
      const remaining = Math.max(0, MAX_IMAGES - currentTotal);
      if (remaining <= 0) return prev;
      const next = [...prev];
      for (const file of allowed.slice(0, remaining)) {
        next.push({ file, previewUrl: URL.createObjectURL(file) });
      }
      return next;
    });
  }

  function removeProductImage(index: number) {
    const combinedOffset = existingImageUrls.length;
    setProductImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].previewUrl);
      return next;
    });
    setProductImagesMainIndex((prev) => {
      const fileIndex = prev - combinedOffset;
      if (fileIndex === index) return 0;
      if (prev > combinedOffset + index) return prev - 1;
      return prev;
    });
  }

  function removeExistingImage(index: number) {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    setProductImagesMainIndex((prev) => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  }

  function setProductImageMain(index: number) {
    setProductImagesMainIndex(index);
  }

  const productImageItems: SortableImageItem[] = [
    ...existingImageUrls.map((url, i) => ({ id: `existing-${i}`, url })),
    ...productImages.map((p, i) => ({ id: `file-${i}`, url: p.previewUrl, file: p.file })),
  ];

  function handleProductImageReorder(newItems: SortableImageItem[]) {
    setExistingImageUrls(newItems.filter((x) => !x.file).map((x) => x.url));
    setProductImages(newItems.filter((x) => x.file).map((x) => ({ file: x.file!, previewUrl: x.url })));
    setProductImagesMainIndex(0);
  }

  function handleProductImageRemove(id: string) {
    const idx = productImageItems.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const existingCount = productImageItems.filter((x) => !x.file).length;
    if (idx < existingCount) removeExistingImage(idx);
    else removeProductImage(idx - existingCount);
  }

  // Функции для работы с вариантами
  function addVariant() {
    const newVariant: Variant = {
      id: crypto.randomUUID(),
      name: `Вариант ${variants.length + 1}`,
      composition: "",
      height_cm: null,
      width_cm: null,
      price: 0,
      is_preorder: false,
      sort_order: variants.length,
      bouquetColors: [],
    };
    setVariants((prev) => [...prev, newVariant]);
    // Первый вариант развернут по умолчанию, остальные — свернуты
    if (variants.length === 0) {
      setExpandedVariants(new Set([String(newVariant.id)]));
    }
  }

  function removeVariant(id: string | number) {
    setVariants((prev) => {
      return prev.filter((v) => v.id !== id).map((v, idx) => ({ ...v, sort_order: idx }));
    });
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      next.delete(String(id));
      return next;
    });
  }

  function toggleVariantExpanded(id: string | number) {
    const key = String(id);
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function updateVariant(id: string | number, updates: Partial<Variant>) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  }

  function reorderVariants(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setVariants((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next.map((v, idx) => ({ ...v, sort_order: idx }));
    });
  }

  useEffect(() => {
    if (!createModalOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCreateModal();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [createModalOpen, closeCreateModal]);

  useEffect(() => {
    if (!createModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [createModalOpen]);

  useEffect(() => {
    if (!detailsModalOpen) return;
    setDetailsError("");
    setDetailsLoading(true);
    fetch("/api/admin/product-details")
      .then((res) => res.json())
      .then((data: { kit?: string }) => {
        setDetailsKit(data.kit ?? "");
      })
      .catch(() => setDetailsError("Ошибка загрузки"))
      .finally(() => setDetailsLoading(false));
  }, [detailsModalOpen]);

  async function handleDetailsSave() {
    setDetailsError("");
    setDetailsSaving(true);
    try {
      const res = await fetch("/api/admin/product-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kit: detailsKit }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Ошибка сохранения");
      }
      setDetailsModalOpen(false);
    } catch (e) {
      setDetailsError(String((e as Error).message));
    } finally {
      setDetailsSaving(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editProductId) return;
    setCreateError("");
    setFieldErrors({});
    const validationErrors = validateCreateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    setCreateLoading(true);
    try {
      if (createType === "simple") {
        const uploadedUrls: string[] = [];
        if (productImages.length > 0) {
          setProductImagesUploading(true);
          for (const item of productImages) {
            const formData = new FormData();
            formData.append("file", item.file);
            const res = await fetch("/api/admin/products/upload", { method: "POST", body: formData });
            const { data, rawText, isJson } = await readJsonSafe<{ error?: string; image_url?: string }>(res);
            if (!res.ok) {
              const rawSnippet = rawText ? ` — ${rawText.slice(0, 200)}` : "";
              throw new Error(
                data?.error ??
                  (isJson ? "Ошибка загрузки изображения" : `Ошибка загрузки изображения (не JSON, ${res.status})${rawSnippet}`)
              );
            }
            if (data?.image_url) uploadedUrls.push(data.image_url);
          }
          setProductImagesUploading(false);
        }
        const allUrls = [...existingImageUrls, ...uploadedUrls].slice(0, MAX_IMAGES);
        const mainUrl = allUrls[productImagesMainIndex] ?? allUrls[0] ?? null;
        const otherUrls = allUrls.filter((_, i) => i !== productImagesMainIndex);
        const payload = {
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          composition_size: createForm.composition_size.trim() || null,
          height_cm: createForm.height_cm ?? null,
          width_cm: createForm.width_cm ?? null,
          price: createForm.price,
          image_url: mainUrl,
          images: otherUrls.length > 0 ? otherUrls : [],
          is_active: true,
          is_hidden: createIsHidden,
          is_preorder: createIsPreorder,
          is_new: createIsNew,
          category_slug: selectedCategorySlugs[0] || null,
          category_slugs: selectedCategorySlugs,
          bouquet_colors: selectedBouquetColorKeys.length > 0 ? selectedBouquetColorKeys : null,
          discount_percent: createForm.discount_percent ?? null,
          discount_price: createForm.discount_price ?? null,
        };
        const url = `/api/admin/products/${editProductId}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const { data, rawText, isJson } = await readJsonSafe<{
          error?: string;
          fieldErrors?: Record<string, string[]>;
          id?: string;
        }>(res);
        if (!res.ok) {
          if (data?.fieldErrors && typeof data.fieldErrors === "object") {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(data.fieldErrors)) {
              flat[k] = Array.isArray(v) ? v[0] : String(v);
            }
            setFieldErrors(flat);
          }
          const rawSnippet = rawText ? ` — ${rawText.slice(0, 200)}` : "";
          throw new Error(
            (data?.error ?? (isJson ? "Ошибка сохранения" : `Ошибка сохранения (не JSON, ${res.status})${rawSnippet}`))
          );
        }
        const productId = editProductId || data?.id;
        const productIdForSubcategories = String(productId);
        const saveRes = await fetch(`/api/admin/products/${productIdForSubcategories}/subcategories`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subcategory_ids: selectedOccasionSubcategoryIds.length > 0 ? selectedOccasionSubcategoryIds : null,
          }),
        });
        if (!saveRes.ok) {
          const errorData = await saveRes.json().catch(() => ({}));
          console.error("[admin/products] Error saving subcategories:", errorData);
        }
        const flowerNamesFromComposition = getFlowerNamesFromComposition();
        await fetch(`/api/admin/products/${productIdForSubcategories}/flowers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flower_names: flowerNamesFromComposition }),
        }).catch((e) => console.error("[admin/products] Error saving flowers:", e));
        closeCreateModal();
        load();
      } else {
        const uploadedUrls: string[] = [];
        if (productImages.length > 0) {
          setProductImagesUploading(true);
          for (const item of productImages) {
            const formData = new FormData();
            formData.append("file", item.file);
            const res = await fetch("/api/admin/products/upload", { method: "POST", body: formData });
            const { data, rawText, isJson } = await readJsonSafe<{ error?: string; image_url?: string }>(res);
            if (!res.ok) {
              const rawSnippet = rawText ? ` — ${rawText.slice(0, 200)}` : "";
              throw new Error(
                data?.error ??
                  (isJson ? "Ошибка загрузки изображения" : `Ошибка загрузки изображения (не JSON, ${res.status})${rawSnippet}`)
              );
            }
            if (data?.image_url) uploadedUrls.push(data.image_url);
          }
          setProductImagesUploading(false);
        }
        const allUrls = [...existingImageUrls, ...uploadedUrls].slice(0, MAX_IMAGES);
        const mainUrl = allUrls[productImagesMainIndex] ?? allUrls[0] ?? null;
        const otherUrls = allUrls.filter((_, i) => i !== productImagesMainIndex);
        const payload = {
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          image_url: mainUrl,
          images: otherUrls.length > 0 ? otherUrls : [],
          is_active: true,
          is_hidden: createIsHidden,
          is_new: createIsNew,
          category_slug: selectedCategorySlugs[0] || null,
          category_slugs: selectedCategorySlugs,
          bouquet_colors: selectedBouquetColorKeys.length > 0 ? selectedBouquetColorKeys : null,
        };
        const url = `/api/admin/products/${editProductId}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const { data: patchData, rawText, isJson } = await readJsonSafe<{
          error?: string;
          fieldErrors?: Record<string, string[]>;
        }>(res);
        if (!res.ok) {
          if (patchData?.fieldErrors && typeof patchData.fieldErrors === "object") {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(patchData.fieldErrors)) {
              flat[k] = Array.isArray(v) ? v[0] : String(v);
            }
            setFieldErrors(flat);
          }
          const rawSnippet = rawText ? ` — ${rawText.slice(0, 200)}` : "";
          throw new Error(
            (patchData?.error ??
              (isJson ? "Ошибка сохранения товара" : `Ошибка сохранения товара (не JSON, ${res.status})${rawSnippet}`))
          );
        }
        const currentVariantIds = variants.filter((v) => typeof v.id === "number").map((v) => v.id as number);
        const toDeleteIds = initialVariantIds.filter((id) => !currentVariantIds.includes(id));
        for (const variantId of toDeleteIds) {
          const delRes = await fetch(`/api/admin/products/${editProductId}/variants/${variantId}`, {
            method: "DELETE",
          });
          if (!delRes.ok) {
            const { data: delData, rawText: delText, isJson: delIsJson } = await readJsonSafe<{
              error?: string;
            }>(delRes);
            const rawSnippet = delText ? ` — ${delText.slice(0, 200)}` : "";
            throw new Error(
              delData?.error ??
                (delIsJson ? "Ошибка удаления варианта" : `Ошибка удаления варианта (не JSON, ${delRes.status})${rawSnippet}`)
            );
          }
        }
        for (const v of variants) {
          if (typeof v.id === "number") {
            const vRes = await fetch(`/api/admin/products/${editProductId}/variants/${v.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                size: v.name.trim(),
                photo_label: v.photoLabel?.trim() || null,
                composition: v.composition.trim() || null,
                height_cm: v.height_cm ?? null,
                width_cm: v.width_cm ?? null,
                price: v.price,
                is_preorder: v.is_preorder,
                sort_order: v.sort_order,
                bouquet_colors:
                  v.bouquetColors && v.bouquetColors.length > 0 ? v.bouquetColors : null,
                discount_percent: v.discountPercent ?? null,
                discount_price: v.discountPrice ?? null,
              }),
            });
            if (!vRes.ok) {
              const { data: vData, rawText: vText, isJson: vIsJson } = await readJsonSafe<{ error?: string }>(vRes);
              const rawSnippet = vText ? ` — ${vText.slice(0, 200)}` : "";
              throw new Error(
                vData?.error ??
                  (vIsJson ? "Ошибка сохранения варианта" : `Ошибка сохранения варианта (не JSON, ${vRes.status})${rawSnippet}`)
              );
            }
          } else {
            const vRes = await fetch(`/api/admin/products/${editProductId}/variants`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                size: v.name.trim(),
                photo_label: v.photoLabel?.trim() || null,
                composition: v.composition.trim() || null,
                height_cm: v.height_cm ?? null,
                width_cm: v.width_cm ?? null,
                price: v.price,
                is_preorder: v.is_preorder,
                sort_order: v.sort_order,
                is_active: true,
                bouquet_colors:
                  v.bouquetColors && v.bouquetColors.length > 0 ? v.bouquetColors : null,
                discount_percent: v.discountPercent ?? null,
                discount_price: v.discountPrice ?? null,
              }),
            });
            if (!vRes.ok) {
              const { data: vData, rawText: vText, isJson: vIsJson } = await readJsonSafe<{ error?: string }>(vRes);
              const rawSnippet = vText ? ` — ${vText.slice(0, 200)}` : "";
              throw new Error(
                vData?.error ??
                  (vIsJson ? "Ошибка добавления варианта" : `Ошибка добавления варианта (не JSON, ${vRes.status})${rawSnippet}`)
              );
            }
          }
        }
        const productIdForVariant = String(editProductId);
        const subcatRes = await fetch(`/api/admin/products/${productIdForVariant}/subcategories`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subcategory_ids: selectedOccasionSubcategoryIds.length > 0 ? selectedOccasionSubcategoryIds : null,
          }),
        });
        if (!subcatRes.ok) {
          const err = await subcatRes.json().catch(() => ({}));
          console.error("[admin/products] Error saving subcategories (variant):", err);
        }
        const flowerNamesFromCompositionVariant = getFlowerNamesFromComposition();
        await fetch(`/api/admin/products/${productIdForVariant}/flowers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flower_names: flowerNamesFromCompositionVariant }),
        }).catch((err) => console.error("[admin/products] Error saving flowers (variant):", err));
        closeCreateModal();
        load();
      }
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setFieldErrors({});

    const validationErrors = validateCreateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setCreateLoading(true);

    try {
      let data: { error?: string; fieldErrors?: Record<string, string[]>; id?: string | number } = {};
      if (createType === "simple") {
        // Загрузка изображений для простого товара
        const imageUrls: string[] = [];
        if (productImages.length > 0) {
          setProductImagesUploading(true);
          try {
            for (const item of productImages) {
              const formData = new FormData();
              formData.append("file", item.file);
              const res = await fetch("/api/admin/products/upload", {
                method: "POST",
                body: formData,
              });
              const { data, rawText, isJson } = await readJsonSafe<{ error?: string; image_url?: string }>(res);
              if (!res.ok) {
                const msg =
                  data?.error ??
                  (isJson ? "Ошибка загрузки изображения" : `Ошибка загрузки (${res.status})${rawText ? `: ${rawText.slice(0, 150)}` : ""}`);
                if (res.status === 413) {
                  setCreateError("Слишком большой файл или ограничение прокси. Проверьте client_max_body_size в nginx.");
                } else {
                  setCreateError(`Не удалось загрузить изображения: ${msg}`);
                }
                setProductImagesUploading(false);
                setCreateLoading(false);
                return;
              }
              if (data?.image_url) imageUrls.push(data.image_url);
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[admin/products] upload error:", err);
            setCreateError(`Не удалось загрузить изображения: ${msg}`);
            setProductImagesUploading(false);
            setCreateLoading(false);
            return;
          }
          setProductImagesUploading(false);
        }

        const limitedImageUrls = imageUrls.slice(0, MAX_IMAGES);
        const mainUrl = limitedImageUrls[productImagesMainIndex] ?? limitedImageUrls[0] ?? undefined;
        const otherUrls =
          limitedImageUrls.length > 0
            ? [...limitedImageUrls.slice(0, productImagesMainIndex), ...limitedImageUrls.slice(productImagesMainIndex + 1)]
            : [];
        const slug = slugify(createForm.name);
        const category_slugs = selectedCategorySlugs.length > 0 ? selectedCategorySlugs : null;

        const payload = {
          type: "simple",
          name: createForm.name.trim(),
          slug: slug || undefined,
          description: createForm.description.trim() || undefined,
          composition_size: createForm.composition_size.trim() || undefined,
          height_cm: createForm.height_cm ?? null,
          width_cm: createForm.width_cm ?? null,
          price: createForm.price,
          image_url: mainUrl ?? null,
          images: otherUrls.length > 0 ? otherUrls : [],
          is_active: true,
          is_hidden: createIsHidden,
          is_preorder: createIsPreorder,
          is_new: createIsNew,
          category_slugs,
          bouquet_colors: selectedBouquetColorKeys.length > 0 ? selectedBouquetColorKeys : null,
          discount_percent: createForm.discount_percent ?? null,
          discount_price: createForm.discount_price ?? null,
        };

        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const raw = await res.text();
        data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          console.error("[admin/products] POST failed: non-JSON response", res.status, raw.slice(0, 200));
          setCreateError(
            res.status === 500 ? "Сервер вернул ошибку. Проверьте терминал (логи сервера)." : `Ошибка ${res.status}`
          );
          setCreateLoading(false);
          return;
        }
        if (!res.ok) {
          const msg = data?.error ?? "Ошибка создания";
          console.error("[admin/products] POST failed:", res.status, data);
          if (data?.fieldErrors && typeof data.fieldErrors === "object") {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(data.fieldErrors)) {
              flat[k] = Array.isArray(v) ? v[0] : String(v);
            }
            setFieldErrors(flat);
          }
          setCreateError(msg);
          setCreateLoading(false);
          return;
        }
      } else if (createType === "variant") {
        // Загрузка изображений для вариантного товара
        const imageUrls: string[] = [];
        if (productImages.length > 0) {
          setProductImagesUploading(true);
          try {
            for (const item of productImages) {
              const formData = new FormData();
              formData.append("file", item.file);
              const res = await fetch("/api/admin/products/upload", {
                method: "POST",
                body: formData,
              });
              const { data, rawText, isJson } = await readJsonSafe<{ error?: string; image_url?: string }>(res);
              if (!res.ok) {
                const msg =
                  data?.error ??
                  (isJson ? "Ошибка загрузки изображения" : `Ошибка загрузки (${res.status})${rawText ? `: ${rawText.slice(0, 150)}` : ""}`);
                if (res.status === 413) {
                  setCreateError("Слишком большой файл или ограничение прокси. Проверьте client_max_body_size в nginx.");
                } else {
                  setCreateError(`Не удалось загрузить изображения: ${msg}`);
                }
                setProductImagesUploading(false);
                setCreateLoading(false);
                return;
              }
              if (data?.image_url) imageUrls.push(data.image_url);
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[admin/products] upload error:", err);
            setCreateError(`Не удалось загрузить изображения: ${msg}`);
            setProductImagesUploading(false);
            setCreateLoading(false);
            return;
          }
          setProductImagesUploading(false);
        }

        const limitedImageUrls = imageUrls.slice(0, MAX_IMAGES);
        const mainUrl = limitedImageUrls[productImagesMainIndex] ?? limitedImageUrls[0] ?? undefined;
        const otherUrls =
          limitedImageUrls.length > 0
            ? [...limitedImageUrls.slice(0, productImagesMainIndex), ...limitedImageUrls.slice(productImagesMainIndex + 1)]
            : [];

        const slug = slugify(createForm.name);
        const category_slugs = selectedCategorySlugs.length > 0 ? selectedCategorySlugs : null;

        const payload = {
          type: "variant",
          name: createForm.name.trim(),
          slug: slug || undefined,
          description: createForm.description.trim() || undefined,
          image_url: mainUrl ?? null,
          images: otherUrls.length > 0 ? otherUrls : [],
          is_active: true,
          is_hidden: createIsHidden,
          is_new: createIsNew,
          category_slugs,
          bouquet_colors: selectedBouquetColorKeys.length > 0 ? selectedBouquetColorKeys : null,
          variants: variants.map((v) => ({
            name: v.name.trim(),
            composition: v.composition.trim() || null,
            height_cm: v.height_cm ?? null,
            width_cm: v.width_cm ?? null,
            price: v.price,
            is_preorder: v.is_preorder,
            sort_order: v.sort_order,
            is_active: true,
            bouquet_colors:
              v.bouquetColors && v.bouquetColors.length > 0 ? v.bouquetColors : null,
            discount_percent: v.discountPercent ?? null,
            discount_price: v.discountPrice ?? null,
          })),
        };

        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const raw = await res.text();
        data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          console.error("[admin/products] POST failed: non-JSON response", res.status, raw.slice(0, 200));
          setCreateError(
            res.status === 500 ? "Сервер вернул ошибку. Проверьте терминал (логи сервера)." : `Ошибка ${res.status}`
          );
          setCreateLoading(false);
          return;
        }
        if (!res.ok) {
          const msg = data?.error ?? "Ошибка создания";
          console.error("[admin/products] POST failed:", res.status, data);
          if (data?.fieldErrors && typeof data.fieldErrors === "object") {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(data.fieldErrors)) {
              flat[k] = Array.isArray(v) ? v[0] : String(v);
            }
            setFieldErrors(flat);
          }
          setCreateError(msg);
          setCreateLoading(false);
          return;
        }
        const createdProductId = data?.id;
        if (createdProductId) {
          const pid = String(createdProductId);
          const saveRes = await fetch(`/api/admin/products/${pid}/subcategories`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subcategory_ids: selectedOccasionSubcategoryIds.length > 0 ? selectedOccasionSubcategoryIds : null,
            }),
          });
          if (!saveRes.ok) {
            const errorData = await saveRes.json().catch(() => ({}));
            console.error("[admin/products] Error saving subcategories:", errorData);
          }
          const flowerNamesCreate = parseCompositionFlowers(createForm.composition_size);
          await fetch(`/api/admin/products/${pid}/flowers`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ flower_names: flowerNamesCreate }),
          }).catch((err) => console.error("[admin/products] Error saving flowers (create):", err));
        }
      } else if (createType === "variant") {
        const variantData = data as { id?: number };
        const createdVariantProductId = variantData.id ? `vp-${variantData.id}` : null;
        if (createdVariantProductId) {
          const saveRes = await fetch(`/api/admin/products/${createdVariantProductId}/subcategories`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subcategory_ids: selectedOccasionSubcategoryIds.length > 0 ? selectedOccasionSubcategoryIds : null,
            }),
          });
          if (!saveRes.ok) {
            const errorData = await saveRes.json().catch(() => ({}));
            console.error("[admin/products] Error saving subcategories:", errorData);
          }
          const flowerNamesVariantCreate = variants.flatMap((v) => parseCompositionFlowers(v.composition));
          const uniqueFlowerNames = Array.from(new Set(flowerNamesVariantCreate.filter((n) => n.trim())));
          await fetch(`/api/admin/products/${createdVariantProductId}/flowers`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ flower_names: uniqueFlowerNames }),
          }).catch((err) => console.error("[admin/products] Error saving flowers (create variant):", err));
        }
      }

      closeCreateModal();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[admin/products] POST error:", e);
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="h-12 animate-pulse bg-gray-100" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex h-14 border-t border-gray-100">
              <div className="w-14 shrink-0 animate-pulse bg-gray-50" />
              <div className="flex-1 space-y-2 p-3">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-color-text-main">Товары</h2>
          <button
            type="button"
            onClick={() => setDetailsModalOpen(true)}
            className="rounded border border-border-block bg-white px-3 py-2 text-sm text-color-text-main hover:bg-[rgba(31,42,31,0.06)]"
          >
            Детали
          </button>
          <button
            type="button"
            onClick={() => setFlowersWhitelistModalOpen(true)}
            className="rounded border border-border-block bg-white px-3 py-2 text-sm text-color-text-main hover:bg-[rgba(31,42,31,0.06)]"
          >
            Цветы в составе
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Поиск по названию или slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-border-block bg-white px-3 py-2 text-sm w-64 text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
          />
          <button
            type="button"
            onClick={() => {
              setEditProductId(null);
              setInitialVariantIds([]);
              setCreateType("simple");
              setExistingImageUrls([]);
              setExistingMainImageUrl(null);
              productImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
              setProductImages([]);
              setProductImagesMainIndex(0);
              setSelectedCategorySlugs([]);
              setCreateIsHidden(false);
              setCreateIsPreorder(false);
              setCreateForm(initialForm);
              setCreateError("");
              setFieldErrors({});
              setVariants([]);
              setExpandedVariants(new Set());
              setCreateModalOpen(true);
            }}
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
          >
            Добавить
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="h-12 animate-pulse bg-gray-100" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex h-14 border-t border-gray-100">
                <div className="w-14 shrink-0 animate-pulse bg-gray-50" />
                <div className="flex-1 space-y-2 p-3">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-color-text-secondary py-8 text-center rounded-xl border border-border-block bg-white">
            Нет товаров. Нажмите «Добавить».
          </p>
        ) : (
          <ProductsList
            products={products}
            onReorder={async (newOrder) => {
              setProducts(newOrder);
              const res = await fetch("/api/admin/products/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: newOrder.map((p, i) => ({ id: p.id, sort_order: i })),
                }),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err?.error ?? "Ошибка сохранения порядка");
                load();
              }
            }}
            onEdit={(p) => {
              setEditProductId(p.id);
              setCreateModalOpen(true);
            }}
            onToggleHidden={handleToggleHidden}
            onDeleteClick={(p) => setDeleteConfirmProductId(p.id)}
            togglingId={togglingProductId}
          />
        )}
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={closeCreateModal}
        title={isEditMode ? "Редактировать товар" : "Новый товар"}
        size="full"
        footer={
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              form="product-form"
              disabled={createLoading || productImagesUploading || editLoading || deleteLoading}
              className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
            >
              {productImagesUploading
                ? "Загрузка изображений…"
                : createLoading
                  ? isEditMode
                    ? "Сохранение…"
                    : "Создание…"
                  : isEditMode
                    ? "Сохранить изменения"
                    : "Создать"}
            </button>
            <button
              type="button"
              onClick={closeCreateModal}
              className="rounded border border-outline-btn-border px-4 py-2 text-color-text-main hover:bg-outline-btn-hover-bg"
            >
              Отмена
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={createLoading || productImagesUploading || editLoading || deleteLoading}
                className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? "Удаление…" : "Удалить"}
              </button>
            )}
          </div>
        }
      >
        <form
          id="product-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (editProductId != null) {
              handleEditSubmit(e);
            } else {
              handleCreateSubmit(e);
            }
          }}
        >
          <div className="space-y-3">
                  {editLoading && <p className="text-sm text-color-text-secondary">Загрузка товара…</p>}
                  {createError && (
                    <p className="text-sm text-red-600" role="alert">
                      {createError}
                    </p>
                  )}
                  <div>
                    <span className="block text-sm font-medium text-color-text-main mb-1.5">Тип товара</span>
                    <div className="flex gap-4">
                      <label
                        className={`flex items-center gap-2 ${isEditMode ? "cursor-default opacity-70" : "cursor-pointer"}`}
                      >
                        <input
                          type="radio"
                          name="createType"
                          value="simple"
                          checked={createType === "simple"}
                          onChange={() => !isEditMode && setCreateType("simple")}
                          disabled={isEditMode}
                          className="border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                        />
                        <span className="text-sm text-color-text-main">Обычный</span>
                      </label>
                      <label
                        className={`flex items-center gap-2 ${isEditMode ? "cursor-default opacity-70" : "cursor-pointer"}`}
                      >
                        <input
                          type="radio"
                          name="createType"
                          value="variant"
                          checked={createType === "variant"}
                          onChange={() => !isEditMode && setCreateType("variant")}
                          disabled={isEditMode}
                          className="border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                        />
                        <span className="text-sm text-color-text-main">Варианты</span>
                      </label>
                    </div>
                    {fieldErrors.type && <p className="mt-0.5 text-xs text-red-600">{fieldErrors.type}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-color-text-main mb-1">Название</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded border border-border-block bg-white px-3 py-1.5 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                      required
                    />
                    {fieldErrors.name && <p className="mt-0.5 text-xs text-red-600">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-color-text-main mb-1">Описание</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded border border-border-block bg-white px-3 py-1.5 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                      rows={3}
                    />
                    {fieldErrors.description && (
                      <p className="mt-0.5 text-xs text-red-600">{fieldErrors.description}</p>
                    )}
                  </div>
                  {createType === "simple" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-color-text-main mb-1">Состав</label>
                        <textarea
                          value={createForm.composition_size}
                          onChange={(e) => setCreateForm((f) => ({ ...f, composition_size: e.target.value }))}
                          className="w-full rounded border border-border-block bg-white px-3 py-1.5 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                          rows={3}
                          placeholder="Розы 7 шт, Тюльпаны 8 шт, Гипсофила…"
                        />
                        <p className="mt-0.5 text-xs text-color-text-secondary">Укажите состав букета вручную</p>
                        {fieldErrors.composition_size && (
                          <p className="mt-0.5 text-xs text-red-600">{fieldErrors.composition_size}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-color-text-main mb-1">Изображения</label>
                        <p className="text-xs text-color-text-secondary mb-1.5">
                          Максимум 5 файлов. Первое изображение — главное. Перетаскивайте для изменения порядка.
                        </p>
                        <input
                          type="file"
                          accept={ALLOWED_IMAGE_TYPES}
                          multiple
                          onChange={(e) => addProductImages(e.target.files)}
                          disabled={existingImageUrls.length + productImages.length >= MAX_IMAGES}
                          className="block w-full text-sm text-color-text-main file:mr-2 file:rounded file:border-0 file:bg-accent-btn file:px-3 file:py-1.5 file:text-white file:hover:bg-accent-btn-hover focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                        />
                        {fieldErrors.images && <p className="mt-0.5 text-xs text-red-600">{fieldErrors.images}</p>}
                        {productImageItems.length > 0 && (
                          <div className="mt-3">
                            <AdminSortableImages
                              items={productImageItems}
                              onReorder={handleProductImageReorder}
                              onRemove={handleProductImageRemove}
                              firstIsMain
                              thumbSize={88}
                            />
                          </div>
                        )}
                      </div>
                      {/* По поводу (аккордеон, свернут по умолчанию) */}
                      <div className="border border-border-block rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenOccasions((v) => !v)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-color-text-main bg-[rgba(31,42,31,0.04)] hover:bg-[rgba(31,42,31,0.08)]"
                        >
                          <span className="text-color-text-secondary text-xs w-4">{openOccasions ? "▼" : "▶"}</span>
                          По поводу
                        </button>
                        {openOccasions && (
                        <div className="px-3 pb-3 pt-1 border-t border-border-block">
                        <p className="text-xs text-color-text-secondary mb-2">
                          Выберите подкатегории &quot;По поводу&quot; для этого товара.
                        </p>
                        {loadingOccasions ? (
                          <p className="text-sm text-color-text-secondary">Загрузка списка...</p>
                        ) : errorOccasions ? (
                          <div className="text-sm text-red-600">
                            <p>{errorOccasions}</p>
                            <button
                              type="button"
                              onClick={() => {
                                const loadOccasions = async () => {
                                  try {
                                    setLoadingOccasions(true);
                                    setErrorOccasions("");
                                    const categoriesRes = await fetch("/api/admin/categories");
                                    if (!categoriesRes.ok) throw new Error("Ошибка загрузки категорий");
                                    const categories = await categoriesRes.json();
                                    const occasionsCategory = categories.find(
                                      (c: { slug: string }) => c.slug === OCCASIONS_CATEGORY_SLUG
                                    );
                                    if (!occasionsCategory) {
                                      setErrorOccasions(
                                        'Категория "По поводу" не найдена. Примените миграцию categories-add-occasions-category.sql'
                                      );
                                      return;
                                    }
                                    setOccasionsCategoryId(occasionsCategory.id);
                                    const subcategoriesRes = await fetch(
                                      `/api/admin/subcategories?category_id=${occasionsCategory.id}`
                                    );
                                    if (!subcategoriesRes.ok) throw new Error("Ошибка загрузки подкатегорий");
                                    const occasionsSubcategories = await subcategoriesRes.json();
                                    setAvailableOccasionsSubcategories(occasionsSubcategories);
                                  } catch (e) {
                                    setErrorOccasions(e instanceof Error ? e.message : "Ошибка загрузки");
                                  } finally {
                                    setLoadingOccasions(false);
                                  }
                                };
                                loadOccasions();
                              }}
                              className="mt-2 text-xs underline text-blue-600 hover:text-blue-800"
                            >
                              Повторить загрузку
                            </button>
                          </div>
                        ) : availableOccasionsSubcategories.length === 0 ? (
                          <p className="text-sm text-color-text-secondary">
                            Нет подкатегорий. Добавьте в админке → По поводу.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 border border-border-block rounded-lg divide-x divide-border-block max-h-60 overflow-y-auto">
                            {[0, 1].map((col) => {
                              const mid = Math.ceil(availableOccasionsSubcategories.length / 2);
                              const list =
                                col === 0
                                  ? availableOccasionsSubcategories.slice(0, mid)
                                  : availableOccasionsSubcategories.slice(mid);
                              return (
                                <ul key={col} className="divide-y divide-border-block">
                                  {list.map((subcategory) => (
                                    <li
                                      key={subcategory.id}
                                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-[rgba(31,42,31,0.06)]"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`occasion-subcat-${subcategory.id}`}
                                        checked={selectedOccasionSubcategoryIds.includes(subcategory.id)}
                                        onChange={() => {
                                          setSelectedOccasionSubcategoryIds((prev) =>
                                            prev.includes(subcategory.id)
                                              ? prev.filter((id) => id !== subcategory.id)
                                              : [...prev, subcategory.id]
                                          );
                                        }}
                                        className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                      />
                                      <label
                                        htmlFor={`occasion-subcat-${subcategory.id}`}
                                        className="text-sm text-color-text-main cursor-pointer flex-1"
                                      >
                                        {subcategory.name}
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              );
                            })}
                          </div>
                        )}
                        </div>
                        )}
                      </div>
                      {/* Цвет букета (аккордеон) */}
                      <div className="border border-border-block rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenBouquetColors((v) => !v)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-color-text-main bg-[rgba(31,42,31,0.04)] hover:bg-[rgba(31,42,31,0.08)]"
                        >
                          <span className="text-color-text-secondary text-xs w-4">{openBouquetColors ? "▼" : "▶"}</span>
                          Цвет букета
                        </button>
                        {openBouquetColors && (
                        <div className="px-3 pb-3 pt-1 border-t border-border-block">
                        <p className="text-xs text-color-text-secondary mb-2">
                          Отметьте цвета для фильтрации в каталоге.
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 border border-border-block rounded-lg divide-x divide-border-block max-h-60 overflow-y-auto">
                          {[0, 1].map((col) => {
                            const mid = Math.ceil(BOUQUET_COLORS.length / 2);
                            const list = col === 0 ? BOUQUET_COLORS.slice(0, mid) : BOUQUET_COLORS.slice(mid);
                            return (
                              <ul key={col} className="divide-y divide-border-block">
                                {list.map((item) => (
                                  <li
                                    key={item.key}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-[rgba(31,42,31,0.06)]"
                                  >
                                    <BouquetColorSwatch item={item} />
                                    <input
                                      type="checkbox"
                                      id={`bouquet-color-${item.key}`}
                                      checked={selectedBouquetColorKeys.includes(item.key)}
                                      onChange={() => {
                                        setSelectedBouquetColorKeys((prev) =>
                                          prev.includes(item.key)
                                            ? prev.filter((k) => k !== item.key)
                                            : [...prev, item.key]
                                        );
                                      }}
                                      className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                    />
                                    <label
                                      htmlFor={`bouquet-color-${item.key}`}
                                      className="text-sm text-color-text-main cursor-pointer flex-1"
                                    >
                                      {item.label}
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            );
                          })}
                        </div>
                        </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-color-text-main mb-1">Размер</label>
                        <div className="flex gap-3 items-center">
                          <div className="flex-1">
                            <label className="sr-only">Высота, см</label>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={createForm.height_cm ?? ""}
                              onChange={(e) =>
                                setCreateForm((f) => ({
                                  ...f,
                                  height_cm: e.target.value === "" ? null : parseInt(e.target.value, 10) || null,
                                }))
                              }
                              onWheel={(e) => (e.target as HTMLInputElement).blur()}
                              placeholder="45"
                              className="w-full rounded border border-border-block bg-white px-3 py-1.5 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-color-text-secondary mt-0.5 block">Высота, см</span>
                          </div>
                          <div className="flex-1">
                            <label className="sr-only">Ширина, см</label>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={createForm.width_cm ?? ""}
                              onChange={(e) =>
                                setCreateForm((f) => ({
                                  ...f,
                                  width_cm: e.target.value === "" ? null : parseInt(e.target.value, 10) || null,
                                }))
                              }
                              onWheel={(e) => (e.target as HTMLInputElement).blur()}
                              placeholder="40"
                              className="w-full rounded border border-border-block bg-white px-3 py-1.5 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-color-text-secondary mt-0.5 block">Ширина, см</span>
                          </div>
                        </div>
                        <p className="mt-0.5 text-xs text-color-text-secondary">Размер букета в сантиметрах</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-color-text-main mb-1">Цена (₽)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={createForm.price || ""}
                          onChange={(e) => setCreateForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          className="w-32 rounded border border-border-block bg-white px-3 py-1.5 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          required
                        />
                        {fieldErrors.price && <p className="mt-0.5 text-xs text-red-600">{fieldErrors.price}</p>}
                      </div>
                      {/* Скидка (скрываемый блок) — только для простого товара */}
                      {createType === "simple" && (
                        <div className="border border-border-block rounded-lg p-3 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                (createForm.discount_percent != null && createForm.discount_percent > 0) ||
                                (createForm.discount_price != null && createForm.discount_price > 0)
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const pct = 10;
                                  const base = createForm.price || 0;
                                  setCreateForm((f) => ({
                                    ...f,
                                    discount_percent: pct,
                                    discount_price: base > 0 ? calcPriceFromPercent(base, pct) : null,
                                  }));
                                } else {
                                  setCreateForm((f) => ({ ...f, discount_percent: null, discount_price: null }));
                                }
                              }}
                              className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                            />
                            <span className="text-sm font-medium text-color-text-main">Скидка</span>
                          </label>
                          {((createForm.discount_percent != null && createForm.discount_percent > 0) ||
                            (createForm.discount_price != null && createForm.discount_price > 0)) && (
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-block">
                              <div>
                                <label className="block text-xs text-color-text-main mb-0.5">Скидка, %</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={createForm.discount_percent ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value === "" ? null : parseFloat(e.target.value);
                                    const base = createForm.price || 0;
                                    setCreateForm((f) => ({
                                      ...f,
                                      discount_percent: v,
                                      discount_price:
                                        v != null && v > 0 && base > 0 ? calcPriceFromPercent(base, v) : f.discount_price,
                                    }));
                                  }}
                                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                  className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-color-text-main mb-0.5">Цена со скидкой (₽)</label>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={createForm.discount_price ?? ""}
                                  onChange={(e) =>
                                    setCreateForm((f) => ({
                                      ...f,
                                      discount_price: e.target.value === "" ? null : parseFloat(e.target.value) || null,
                                    }))
                                  }
                                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                  className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                {createForm.price > 0 && createForm.discount_percent != null && createForm.discount_percent > 0 && (
                                  <p className="mt-0.5 text-[10px] text-color-text-secondary">
                                    Рассчитанная цена: {calcPriceFromPercent(createForm.price, createForm.discount_percent).toLocaleString("ru-RU")} ₽
                                  </p>
                                )}
                                {fieldErrors.discount_price && (
                                  <p className="mt-0.5 text-xs text-red-600">{fieldErrors.discount_price}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Категории (аккордеон) */}
                      <div className="border border-border-block rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenCategories((v) => !v)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-color-text-main bg-[rgba(31,42,31,0.04)] hover:bg-[rgba(31,42,31,0.08)]"
                        >
                          <span className="text-color-text-secondary text-xs w-4">{openCategories ? "▼" : "▶"}</span>
                          Категории
                        </button>
                        {openCategories && (
                        <div className="px-3 pb-3 pt-1 border-t border-border-block">
                        {categories.length === 0 ? (
                          <p className="text-sm text-color-text-secondary">Нет активных категорий.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 border border-border-block rounded-lg divide-x divide-border-block max-h-40 overflow-y-auto">
                            {[0, 1].map((col) => {
                              const mid = Math.ceil(categories.length / 2);
                              const list = col === 0 ? categories.slice(0, mid) : categories.slice(mid);
                              return (
                                <ul key={col} className="divide-y divide-border-block">
                                  {list.map((cat) => (
                                    <li
                                      key={cat.id}
                                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-[rgba(31,42,31,0.06)]"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`cat-${cat.slug}`}
                                        checked={selectedCategorySlugs.includes(cat.slug)}
                                        onChange={() => toggleCategorySlug(cat.slug)}
                                        className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                      />
                                      <label
                                        htmlFor={`cat-${cat.slug}`}
                                        className="text-sm text-color-text-main cursor-pointer flex-1"
                                      >
                                        {cat.name}
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              );
                            })}
                          </div>
                        )}
                        {fieldErrors.categories && (
                          <p className="mt-0.5 text-xs text-red-600">{fieldErrors.categories}</p>
                        )}
                        </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createIsHidden}
                            onChange={(e) => setCreateIsHidden(e.target.checked)}
                            className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                          />
                          <span className="text-sm text-color-text-main">Скрыть с витрины</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createIsPreorder}
                            onChange={(e) => setCreateIsPreorder(e.target.checked)}
                            className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                          />
                          <span className="text-sm text-color-text-main">Предзаказ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createIsNew}
                            onChange={(e) => setCreateIsNew(e.target.checked)}
                            className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                          />
                          <span className="text-sm text-color-text-main">Новый</span>
                        </label>
                      </div>
                      <div className="space-y-0.5 text-xs text-color-text-secondary">
                        <p>«Скрыть с витрины» — товар не показывается на сайте, но остаётся в админке.</p>
                        <p>
                          «Предзаказ» — товар виден на витрине, а кнопки «В корзину» заменяются на оформление предзаказа.
                        </p>
                        <p>
                          «Новый» — на карточке товара в каталоге и «Рекомендуем» появится бейдж «новый». Автоматически
                          скрывается через 30 дней.
                        </p>
                      </div>
                    </>
                  )}
                  {createType === "variant" && (
                    <>
                      {/* Блок вариантов */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-color-text-main">Варианты</label>
                          <button
                            type="button"
                            onClick={addVariant}
                            className="text-sm px-3 py-1 rounded text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
                          >
                            Добавить вариант
                          </button>
                        </div>
                        {fieldErrors.variants && <p className="mb-2 text-xs text-red-600">{fieldErrors.variants}</p>}
                        {variants.length === 0 && (
                          <p className="text-sm text-color-text-secondary py-3 text-center border border-border-block rounded">
                            Нет вариантов. Нажмите «Добавить вариант».
                          </p>
                        )}
                        {variants.length > 0 && (
                          <div className="space-y-2">
                            {variants.map((variant, idx) => {
                              const isExpanded = expandedVariants.has(String(variant.id));
                              return (
                                <div
                                  key={variant.id}
                                  data-index={idx}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const toIndex = parseInt(e.currentTarget.getAttribute("data-index") ?? "0", 10);
                                    if (variantsDraggedIndex !== null && variantsDraggedIndex !== toIndex) {
                                      reorderVariants(variantsDraggedIndex, toIndex);
                                    }
                                    setVariantsDraggedIndex(null);
                                  }}
                                  className={`border rounded-lg bg-[rgba(31,42,31,0.04)] ${
                                    variantsDraggedIndex === idx
                                      ? "border-color-text-main opacity-80"
                                      : "border-border-block"
                                  }`}
                                >
                                  {/* Шапка варианта (всегда видна) */}
                                  <div
                                    className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer select-none"
                                    onClick={() => toggleVariantExpanded(variant.id)}
                                  >
                                    {/* Drag handle */}
                                    <span
                                      draggable
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        setVariantsDraggedIndex(idx);
                                      }}
                                      onDragEnd={() => setVariantsDraggedIndex(null)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="cursor-grab active:cursor-grabbing text-color-text-secondary hover:text-color-text-main px-0.5 text-xs"
                                      title="Перетащить"
                                    >
                                      ⋮⋮
                                    </span>
                                    {/* Стрелка */}
                                    <span className="text-color-text-secondary text-xs w-2.5">
                                      {isExpanded ? "▼" : "▶"}
                                    </span>
                                    {/* Название и инфо */}
                                    <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                                      <span className="text-sm font-medium text-color-text-main truncate">
                                        {variant.name || `Вариант ${idx + 1}`}
                                      </span>
                                      {variant.is_preorder && (
                                        <span className="text-[10px] px-1 py-0.5 rounded bg-[rgba(111,131,99,0.2)] text-color-bg-main">
                                          Предзаказ
                                        </span>
                                      )}
                                      {/* Флаг "Новый" теперь только на уровне товара (не варианта) */}
                                      {variant.price > 0 && (
                                        <span className="text-xs text-color-text-secondary">
                                          {variant.price.toLocaleString("ru-RU")} ₽
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Контент варианта (только если развернут) */}
                                  {isExpanded && (
                                    <div className="px-2.5 pb-2 pt-1 space-y-1.5 border-t border-border-block">
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="Название варианта"
                                          value={variant.name}
                                          onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                                          className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                                        />
                                        {fieldErrors[`variant_${idx}_name`] && (
                                          <p className="mt-0.5 text-xs text-red-600">
                                            {fieldErrors[`variant_${idx}_name`]}
                                          </p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="block text-xs text-color-text-main mb-0.5">На фото (текст)</label>
                                        <input
                                          type="text"
                                          placeholder="Например: 31 штука, M размер"
                                          value={variant.photoLabel ?? ""}
                                          onChange={(e) =>
                                            updateVariant(variant.id, {
                                              photoLabel: e.target.value.trim() || null,
                                            })
                                          }
                                          className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                                        />
                                        <p className="mt-0.5 text-[10px] text-color-text-secondary">
                                          Показывается на карточке под названием варианта: «На фото: …»
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs text-color-text-main mb-0.5">Состав</label>
                                          <textarea
                                            placeholder="Розы 7 шт, Тюльпаны 8 шт…"
                                            value={variant.composition}
                                            onChange={(e) => updateVariant(variant.id, { composition: e.target.value })}
                                            className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                                            rows={2}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-color-text-main mb-0.5">Размер</label>
                                          <div className="flex gap-1.5">
                                            <div className="flex-1">
                                              <input
                                                type="number"
                                                min={0}
                                                step={1}
                                                value={variant.height_cm ?? ""}
                                                onChange={(e) =>
                                                  updateVariant(variant.id, {
                                                    height_cm:
                                                      e.target.value === ""
                                                        ? null
                                                        : parseInt(e.target.value, 10) || null,
                                                  })
                                                }
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                placeholder="45"
                                                className="w-full rounded border border-border-block bg-white px-2 py-1 text-xs text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              />
                                              <span className="text-[10px] text-color-text-secondary block">
                                                Высота, см
                                              </span>
                                            </div>
                                            <div className="flex-1">
                                              <input
                                                type="number"
                                                min={0}
                                                step={1}
                                                value={variant.width_cm ?? ""}
                                                onChange={(e) =>
                                                  updateVariant(variant.id, {
                                                    width_cm:
                                                      e.target.value === ""
                                                        ? null
                                                        : parseInt(e.target.value, 10) || null,
                                                  })
                                                }
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                placeholder="40"
                                                className="w-full rounded border border-border-block bg-white px-2 py-1 text-xs text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              />
                                              <span className="text-[10px] text-color-text-secondary block">
                                                Ширина, см
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            placeholder="Цена (₽)"
                                            value={variant.price || ""}
                                            onChange={(e) =>
                                              updateVariant(variant.id, { price: parseFloat(e.target.value) || 0 })
                                            }
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          {fieldErrors[`variant_${idx}_price`] && (
                                            <p className="mt-0.5 text-xs text-red-600">
                                              {fieldErrors[`variant_${idx}_price`]}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={variant.is_preorder}
                                              onChange={(e) =>
                                                updateVariant(variant.id, { is_preorder: e.target.checked })
                                              }
                                              className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                            />
                                            <span className="text-xs text-color-text-main">Предзаказ</span>
                                          </label>
                                        </div>
                                      </div>
                                      {/* Скидка для варианта */}
                                      <div className="border border-border-block rounded p-2 space-y-1.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={
                                              (variant.discountPercent != null && variant.discountPercent > 0) ||
                                              (variant.discountPrice != null && variant.discountPrice > 0)
                                            }
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                const pct = 10;
                                                const base = variant.price || 0;
                                                updateVariant(variant.id, {
                                                  discountPercent: pct,
                                                  discountPrice: base > 0 ? calcPriceFromPercent(base, pct) : null,
                                                });
                                              } else {
                                                updateVariant(variant.id, { discountPercent: null, discountPrice: null });
                                              }
                                            }}
                                            className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                          />
                                          <span className="text-xs font-medium text-color-text-main">Скидка</span>
                                        </label>
                                        {((variant.discountPercent != null && variant.discountPercent > 0) ||
                                          (variant.discountPrice != null && variant.discountPrice > 0)) && (
                                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-block">
                                            <div>
                                              <label className="block text-[10px] text-color-text-main mb-0.5">Скидка, %</label>
                                              <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={variant.discountPercent ?? ""}
                                                onChange={(e) => {
                                                  const v = e.target.value === "" ? null : parseFloat(e.target.value);
                                                  const base = variant.price || 0;
                                                  updateVariant(variant.id, {
                                                    discountPercent: v,
                                                    discountPrice: v != null && v > 0 && base > 0 ? calcPriceFromPercent(base, v) : variant.discountPrice ?? null,
                                                  });
                                                }}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                className="w-full rounded border border-border-block bg-white px-1.5 py-0.5 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-color-text-main mb-0.5">Цена со скидкой (₽)</label>
                                              <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={variant.discountPrice ?? ""}
                                                onChange={(e) =>
                                                  updateVariant(variant.id, {
                                                    discountPrice: e.target.value === "" ? null : parseFloat(e.target.value) || null,
                                                  })
                                                }
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                className="w-full rounded border border-border-block bg-white px-1.5 py-0.5 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              />
                                              {variant.price > 0 && variant.discountPercent != null && variant.discountPercent > 0 && (
                                                <p className="mt-0.5 text-[10px] text-color-text-secondary">
                                                  Рассчитанная: {calcPriceFromPercent(variant.price, variant.discountPercent).toLocaleString("ru-RU")} ₽
                                                </p>
                                              )}
                                              {fieldErrors[`variant_${idx}_discount_price`] && (
                                                <p className="mt-0.5 text-xs text-red-600">{fieldErrors[`variant_${idx}_discount_price`]}</p>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {/* Кнопка удаления — только в развернутом состоянии */}
                                      <div className="pt-1 border-t border-border-block">
                                        <button
                                          type="button"
                                          onClick={() => removeVariant(variant.id)}
                                          className="text-xs text-color-text-secondary hover:text-red-600"
                                        >
                                          Удалить вариант
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Изображения товара (под блоком Варианты/Состав) */}
                      <div>
                        <label className="block text-sm font-medium text-color-text-main mb-1">Изображения</label>
                        <p className="text-xs text-color-text-secondary mb-1.5">
                          Максимум 5 файлов. Первое изображение — главное. Перетаскивайте для изменения порядка.
                        </p>
                        <input
                          type="file"
                          accept={ALLOWED_IMAGE_TYPES}
                          multiple
                          onChange={(e) => addProductImages(e.target.files)}
                          disabled={existingImageUrls.length + productImages.length >= MAX_IMAGES}
                          className="block w-full text-sm text-color-text-main file:mr-2 file:rounded file:border-0 file:bg-accent-btn file:px-3 file:py-1.5 file:text-white file:hover:bg-accent-btn-hover focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                        />
                        {fieldErrors.images && <p className="mt-0.5 text-xs text-red-600">{fieldErrors.images}</p>}
                        {productImageItems.length > 0 && (
                          <div className="mt-3">
                            <AdminSortableImages
                              items={productImageItems}
                              onReorder={handleProductImageReorder}
                              onRemove={handleProductImageRemove}
                              firstIsMain
                              thumbSize={88}
                            />
                          </div>
                        )}
                      </div>

                      {/* По поводу (вариантный товар, аккордеон) */}
                      <div className="border border-border-block rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenOccasions((v) => !v)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-color-text-main bg-[rgba(31,42,31,0.04)] hover:bg-[rgba(31,42,31,0.08)]"
                        >
                          <span className="text-color-text-secondary text-xs w-4">{openOccasions ? "▼" : "▶"}</span>
                          По поводу
                        </button>
                        {openOccasions && (
                        <div className="px-3 pb-3 pt-1 border-t border-border-block">
                        <p className="text-xs text-color-text-secondary mb-2">
                          Выберите подкатегории &quot;По поводу&quot; для этого товара.
                        </p>
                        {loadingOccasions ? (
                          <p className="text-sm text-color-text-secondary">Загрузка списка...</p>
                        ) : errorOccasions ? (
                          <div className="text-sm text-red-600">
                            <p>{errorOccasions}</p>
                            <button
                              type="button"
                              onClick={() => {
                                const loadOccasions = async () => {
                                  try {
                                    setLoadingOccasions(true);
                                    setErrorOccasions("");
                                    const categoriesRes = await fetch("/api/admin/categories");
                                    if (!categoriesRes.ok) throw new Error("Ошибка загрузки категорий");
                                    const categories = await categoriesRes.json();
                                    const occasionsCategory = categories.find(
                                      (c: { slug: string }) => c.slug === OCCASIONS_CATEGORY_SLUG
                                    );
                                    if (!occasionsCategory) {
                                      setErrorOccasions(
                                        'Категория "По поводу" не найдена. Примените миграцию categories-add-occasions-category.sql'
                                      );
                                      return;
                                    }
                                    setOccasionsCategoryId(occasionsCategory.id);
                                    const subcategoriesRes = await fetch(
                                      `/api/admin/subcategories?category_id=${occasionsCategory.id}`
                                    );
                                    if (!subcategoriesRes.ok) throw new Error("Ошибка загрузки подкатегорий");
                                    const occasionsSubcategories = await subcategoriesRes.json();
                                    setAvailableOccasionsSubcategories(occasionsSubcategories);
                                  } catch (e) {
                                    setErrorOccasions(e instanceof Error ? e.message : "Ошибка загрузки");
                                  } finally {
                                    setLoadingOccasions(false);
                                  }
                                };
                                loadOccasions();
                              }}
                              className="mt-2 text-xs underline text-blue-600 hover:text-blue-800"
                            >
                              Повторить загрузку
                            </button>
                          </div>
                        ) : availableOccasionsSubcategories.length === 0 ? (
                          <p className="text-sm text-color-text-secondary">
                            Нет подкатегорий. Добавьте в админке → По поводу.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 border border-border-block rounded-lg divide-x divide-border-block max-h-60 overflow-y-auto">
                            {[0, 1].map((col) => {
                              const mid = Math.ceil(availableOccasionsSubcategories.length / 2);
                              const list =
                                col === 0
                                  ? availableOccasionsSubcategories.slice(0, mid)
                                  : availableOccasionsSubcategories.slice(mid);
                              return (
                                <ul key={col} className="divide-y divide-border-block">
                                  {list.map((subcategory) => (
                                    <li
                                      key={subcategory.id}
                                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-[rgba(31,42,31,0.06)]"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`variant-occasion-subcat-${subcategory.id}`}
                                        checked={selectedOccasionSubcategoryIds.includes(subcategory.id)}
                                        onChange={() => {
                                          setSelectedOccasionSubcategoryIds((prev) =>
                                            prev.includes(subcategory.id)
                                              ? prev.filter((id) => id !== subcategory.id)
                                              : [...prev, subcategory.id]
                                          );
                                        }}
                                        className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                      />
                                      <label
                                        htmlFor={`variant-occasion-subcat-${subcategory.id}`}
                                        className="text-sm text-color-text-main cursor-pointer flex-1"
                                      >
                                        {subcategory.name}
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              );
                            })}
                          </div>
                        )}
                        </div>
                        )}
                      </div>
                      {/* Цвет букета (вариантный товар, аккордеон) */}
                      <div className="border border-border-block rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenBouquetColors((v) => !v)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-color-text-main bg-[rgba(31,42,31,0.04)] hover:bg-[rgba(31,42,31,0.08)]"
                        >
                          <span className="text-color-text-secondary text-xs w-4">{openBouquetColors ? "▼" : "▶"}</span>
                          Цвет букета
                        </button>
                        {openBouquetColors && (
                        <div className="px-3 pb-3 pt-1 border-t border-border-block">
                        <p className="text-xs text-color-text-secondary mb-2">
                          Отметьте цвета для фильтрации в каталоге.
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 border border-border-block rounded-lg divide-x divide-border-block max-h-60 overflow-y-auto">
                          {[0, 1].map((col) => {
                            const mid = Math.ceil(BOUQUET_COLORS.length / 2);
                            const list = col === 0 ? BOUQUET_COLORS.slice(0, mid) : BOUQUET_COLORS.slice(mid);
                            return (
                              <ul key={col} className="divide-y divide-border-block">
                                {list.map((item) => (
                                  <li
                                    key={item.key}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-[rgba(31,42,31,0.06)]"
                                  >
                                    <BouquetColorSwatch item={item} />
                                    <input
                                      type="checkbox"
                                      id={`variant-bouquet-color-${item.key}`}
                                      checked={selectedBouquetColorKeys.includes(item.key)}
                                      onChange={() => {
                                        setSelectedBouquetColorKeys((prev) =>
                                          prev.includes(item.key)
                                            ? prev.filter((k) => k !== item.key)
                                            : [...prev, item.key]
                                        );
                                      }}
                                      className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                    />
                                    <label
                                      htmlFor={`variant-bouquet-color-${item.key}`}
                                      className="text-sm text-color-text-main cursor-pointer flex-1"
                                    >
                                      {item.label}
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            );
                          })}
                        </div>
                        </div>
                        )}
                      </div>

                      {/* Категории (вариантный товар, аккордеон) */}
                      <div className="border border-border-block rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenCategories((v) => !v)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-color-text-main bg-[rgba(31,42,31,0.04)] hover:bg-[rgba(31,42,31,0.08)]"
                        >
                          <span className="text-color-text-secondary text-xs w-4">{openCategories ? "▼" : "▶"}</span>
                          Категории
                        </button>
                        {openCategories && (
                        <div className="px-3 pb-3 pt-1 border-t border-border-block">
                        {categories.length === 0 ? (
                          <p className="text-sm text-color-text-secondary">Нет активных категорий.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 border border-border-block rounded-lg divide-x divide-border-block max-h-40 overflow-y-auto">
                            {[0, 1].map((col) => {
                              const mid = Math.ceil(categories.length / 2);
                              const list = col === 0 ? categories.slice(0, mid) : categories.slice(mid);
                              return (
                                <ul key={col} className="divide-y divide-border-block">
                                  {list.map((cat) => (
                                    <li
                                      key={cat.id}
                                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-[rgba(31,42,31,0.06)]"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`variant-cat-${cat.slug}`}
                                        checked={selectedCategorySlugs.includes(cat.slug)}
                                        onChange={() => toggleCategorySlug(cat.slug)}
                                        className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                      />
                                      <label
                                        htmlFor={`variant-cat-${cat.slug}`}
                                        className="text-sm text-color-text-main cursor-pointer flex-1"
                                      >
                                        {cat.name}
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              );
                            })}
                          </div>
                        )}
                        {fieldErrors.categories && (
                          <p className="mt-0.5 text-xs text-red-600">{fieldErrors.categories}</p>
                        )}
                        </div>
                        )}
                      </div>

                      {/* Скрыть с витрины */}
                      <div>
                        <div className="flex flex-wrap gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createIsHidden}
                            onChange={(e) => setCreateIsHidden(e.target.checked)}
                            className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                          />
                          <span className="text-sm text-color-text-main">Скрыть с витрины</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={createIsNew}
                              onChange={(e) => setCreateIsNew(e.target.checked)}
                              className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                            />
                            <span className="text-sm text-color-text-main">Новый</span>
                          </label>
                        </div>

                        <div className="mt-1 space-y-0.5 text-xs text-color-text-secondary">
                          <p>«Скрыть с витрины» — товар не показывается на сайте, но остаётся в админке.</p>
                          <p>
                            «Новый» — на карточке товара в каталоге и «Рекомендуем» появится бейдж «новый». Автоматически
                            скрывается через 30 дней.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
          </div>
        </form>
      </Modal>

      <FlowersWhitelistModal
        isOpen={flowersWhitelistModalOpen}
        onClose={() => setFlowersWhitelistModalOpen(false)}
      />

      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Детали товаров">
        <div className="space-y-4">
          {detailsLoading && <p className="text-sm text-color-text-secondary">Загрузка…</p>}
          {detailsError && (
            <p className="text-sm text-red-600" role="alert">
              {detailsError}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-color-text-main mb-1">Подарок при заказе</label>
            <textarea
              value={detailsKit}
              onChange={(e) => setDetailsKit(e.target.value)}
              rows={3}
              className="w-full rounded border border-border-block bg-white px-3 py-2 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
              placeholder="Например: фирменная коробка, открытка, ваза"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDetailsSave}
              disabled={detailsLoading || detailsSaving}
              className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {detailsSaving ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Мини-модалка подтверждения удаления */}
      <Modal
        isOpen={!!deleteConfirmProductId}
        onClose={() => setDeleteConfirmProductId(null)}
        title="Подтверждение удаления"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmProductId(null)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-50"
            >
              Нет
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteConfirmProductId) {
                  handleDeleteFromList(deleteConfirmProductId);
                  setDeleteConfirmProductId(null);
                }
              }}
              className="rounded px-3 py-1.5 text-sm text-white bg-accent-btn hover:bg-accent-btn-hover"
            >
              Да
            </button>
          </div>
        }
      >
        <p className="text-[#111]">Точно удалить товар?</p>
      </Modal>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-color-text-secondary">Загрузка...</div>}>
      <AdminProductsPageContent />
    </Suspense>
  );
}
