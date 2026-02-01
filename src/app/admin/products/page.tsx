"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { slugify } from "@/utils/slugify";

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
};

const MAX_IMAGES = 5;
const ALLOWED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif,image/gif";

type ImageItem = { file: File; previewUrl: string };

type Variant = {
  id: string;
  name: string;
  composition: string;
  price: number;
  is_preorder: boolean;
  image: ImageItem | null;
  sort_order: number;
};

const initialForm = {
  name: "",
  description: "",
  composition_size: "",
  price: 0,
};

export default function AdminProductsPage() {
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
  const [productImagesDraggedIndex, setProductImagesDraggedIndex] = useState<number | null>(null);
  const [productImagesUploading, setProductImagesUploading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; is_active: boolean }[]>([]);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [createIsHidden, setCreateIsHidden] = useState(false);
  const [createIsPreorder, setCreateIsPreorder] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const productImagesRef = useRef<ImageItem[]>([]);
  productImagesRef.current = productImages;

  // Состояние для варианов товара
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantsDraggedIndex, setVariantsDraggedIndex] = useState<number | null>(null);
  const [variantMainImage, setVariantMainImage] = useState<ImageItem | null>(null);
  // Множество id развернутых вариантов (первый добавленный — развернут по умолчанию)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());

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
      .then((res) => res.ok ? res.json() : [])
      .then((data: { id: string; name: string; slug: string; is_active: boolean }[]) =>
        setCategories(data.filter((c) => c.is_active))
      )
      .catch(() => setCategories([]));
  }, [createModalOpen]);

  // Открыть модалку при переходе с /admin/products/new
  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateModalOpen(true);
      window.history.replaceState(null, "", "/admin/products");
    }
  }, [searchParams]);

  function closeCreateModal() {
    productImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setProductImages([]);
    setProductImagesMainIndex(0);
    setSelectedCategorySlugs([]);
    setCreateIsHidden(false);
    setCreateIsPreorder(false);
    setFieldErrors({});
    setCreateModalOpen(false);
    setCreateForm(initialForm);
    setCreateError("");
    // Очистка вариантов
    variants.forEach((v) => {
      if (v.image) URL.revokeObjectURL(v.image.previewUrl);
    });
    setVariants([]);
    setExpandedVariants(new Set());
    if (variantMainImage) URL.revokeObjectURL(variantMainImage.previewUrl);
    setVariantMainImage(null);
  }

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
      const composition = createForm.composition_size.trim();
      if (!composition) errors.composition_size = "Введите состав и размер";
      if (productImages.length === 0) errors.images = "Загрузите хотя бы одно фото";
      if (selectedCategorySlugs.length === 0) errors.categories = "Выберите минимум одну категорию";
      const price = createForm.price;
      if (typeof price !== "number" || price <= 0) errors.price = "Цена должна быть больше 0";
    }
    
    if (createType === "variant") {
      if (!variantMainImage) errors.variantMainImage = "Загрузите главное фото товара";
      if (selectedCategorySlugs.length === 0) errors.categories = "Выберите минимум одну категорию";
      if (variants.length === 0) errors.variants = "Добавьте хотя бы один вариант";
      
      // Валидация каждого варианта
      variants.forEach((v, idx) => {
        if (!v.name.trim()) errors[`variant_${idx}_name`] = "Введите название варианта";
        if (!v.composition.trim()) errors[`variant_${idx}_composition`] = "Введите состав и размер";
        if (!v.is_preorder && (typeof v.price !== "number" || v.price <= 0)) {
          errors[`variant_${idx}_price`] = "Цена должна быть больше 0";
        }
      });
    }
    
    return errors;
  }

  function toggleCategorySlug(slug: string) {
    setSelectedCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function addProductImages(files: FileList | null) {
    if (!files?.length) return;
    const allowed = Array.from(files).filter((f) =>
      ALLOWED_IMAGE_TYPES.split(",").some((t) => f.type === t.trim())
    );
    setProductImages((prev) => {
      const next = [...prev];
      for (const file of allowed) {
        if (next.length >= MAX_IMAGES) break;
        next.push({ file, previewUrl: URL.createObjectURL(file) });
      }
      return next;
    });
  }

  function removeProductImage(index: number) {
    setProductImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].previewUrl);
      return next;
    });
    setProductImagesMainIndex((prev) => {
      if (index === prev) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  }

  function setProductImageMain(index: number) {
    setProductImagesMainIndex(index);
  }

  function reorderProductImages(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setProductImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
    setProductImagesMainIndex((prev) => {
      if (fromIndex === prev) return toIndex;
      if (fromIndex < prev && toIndex >= prev) return prev - 1;
      if (fromIndex > prev && toIndex <= prev) return prev + 1;
      return prev;
    });
  }

  // Функции для работы с вариантами
  function addVariant() {
    const newVariant: Variant = {
      id: crypto.randomUUID(),
      name: `Вариант ${variants.length + 1}`,
      composition: "",
      price: 0,
      is_preorder: false,
      image: null,
      sort_order: variants.length,
    };
    setVariants((prev) => [...prev, newVariant]);
    // Первый вариант развернут по умолчанию, остальные — свернуты
    if (variants.length === 0) {
      setExpandedVariants(new Set([newVariant.id]));
    }
  }

  function removeVariant(id: string) {
    setVariants((prev) => {
      const variant = prev.find((v) => v.id === id);
      if (variant?.image) URL.revokeObjectURL(variant.image.previewUrl);
      return prev.filter((v) => v.id !== id).map((v, idx) => ({ ...v, sort_order: idx }));
    });
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleVariantExpanded(id: string) {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function updateVariant(id: string, updates: Partial<Variant>) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  }

  function addVariantImage(id: string, file: File) {
    const variant = variants.find((v) => v.id === id);
    if (variant?.image) URL.revokeObjectURL(variant.image.previewUrl);
    updateVariant(id, { image: { file, previewUrl: URL.createObjectURL(file) } });
  }

  function removeVariantImage(id: string) {
    const variant = variants.find((v) => v.id === id);
    if (variant?.image) URL.revokeObjectURL(variant.image.previewUrl);
    updateVariant(id, { image: null });
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

  function setMainImageForVariantProduct(file: File) {
    if (variantMainImage) URL.revokeObjectURL(variantMainImage.previewUrl);
    setVariantMainImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function removeMainImageForVariantProduct() {
    if (variantMainImage) URL.revokeObjectURL(variantMainImage.previewUrl);
    setVariantMainImage(null);
  }

  useEffect(() => {
    if (!createModalOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCreateModal();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [createModalOpen]);

  useEffect(() => {
    if (!createModalOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [createModalOpen]);

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
      if (createType === "simple") {
        // Загрузка изображений для простого товара
        let imageUrls: string[] = [];
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
              const data = await res.json();
              if (!res.ok) {
                const msg = data?.error ?? "Ошибка загрузки изображения";
                console.error("[admin/products] upload failed:", res.status, data);
                setCreateError(`Не удалось загрузить изображения: ${msg}`);
                setProductImagesUploading(false);
                setCreateLoading(false);
                return;
              }
              imageUrls.push(data.image_url);
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

        const mainUrl = imageUrls[productImagesMainIndex] ?? imageUrls[0] ?? undefined;
        const otherUrls =
          imageUrls.length > 0
            ? [
                ...imageUrls.slice(0, productImagesMainIndex),
                ...imageUrls.slice(productImagesMainIndex + 1),
              ]
            : [];
        const slug = slugify(createForm.name);
        const category_slugs = selectedCategorySlugs.length > 0 ? selectedCategorySlugs : null;
        
        const payload = {
          type: "simple",
          name: createForm.name.trim(),
          slug: slug || undefined,
          description: createForm.description.trim() || undefined,
          composition_size: createForm.composition_size.trim() || undefined,
          price: createForm.price,
          image_url: mainUrl ?? null,
          images: otherUrls.length > 0 ? otherUrls : null,
          is_active: true,
          is_hidden: createIsHidden,
          is_preorder: createIsPreorder,
          category_slugs,
        };

        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const raw = await res.text();
        let data: { error?: string } = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          console.error("[admin/products] POST failed: non-JSON response", res.status, raw.slice(0, 200));
          setCreateError(res.status === 500 ? "Сервер вернул ошибку. Проверьте терминал (логи сервера)." : `Ошибка ${res.status}`);
          setCreateLoading(false);
          return;
        }
        if (!res.ok) {
          const msg = data?.error ?? "Ошибка создания";
          console.error("[admin/products] POST failed:", res.status, data);
          setCreateError(msg);
          setCreateLoading(false);
          return;
        }
      } else if (createType === "variant") {
        // Загрузка главного фото для вариантного товара
        setProductImagesUploading(true);
        let mainImageUrl: string | null = null;
        
        if (variantMainImage) {
          const formData = new FormData();
          formData.append("file", variantMainImage.file);
          const res = await fetch("/api/admin/products/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) {
            const msg = data?.error ?? "Ошибка загрузки главного фото";
            console.error("[admin/products] main image upload failed:", res.status, data);
            setCreateError(`Не удалось загрузить главное фото: ${msg}`);
            setProductImagesUploading(false);
            setCreateLoading(false);
            return;
          }
          mainImageUrl = data.image_url;
        }

        // Загрузка фото вариантов
        const variantImageUrls: (string | null)[] = [];
        for (const variant of variants) {
          if (variant.image) {
            const formData = new FormData();
            formData.append("file", variant.image.file);
            const res = await fetch("/api/admin/products/upload", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
              const msg = data?.error ?? "Ошибка загрузки фото варианта";
              console.error("[admin/products] variant image upload failed:", res.status, data);
              setCreateError(`Не удалось загрузить фото варианта "${variant.name}": ${msg}`);
              setProductImagesUploading(false);
              setCreateLoading(false);
              return;
            }
            variantImageUrls.push(data.image_url);
          } else {
            variantImageUrls.push(null);
          }
        }
        setProductImagesUploading(false);

        // Создание вариантного товара с вариантами
        const slug = slugify(createForm.name);
        const category_slugs = selectedCategorySlugs.length > 0 ? selectedCategorySlugs : null;
        
        const payload = {
          type: "variant",
          name: createForm.name.trim(),
          slug: slug || undefined,
          description: createForm.description.trim() || undefined,
          image_url: mainImageUrl,
          is_active: true,
          is_hidden: createIsHidden,
          category_slugs,
          variants: variants.map((v, idx) => ({
            name: v.name.trim(),
            composition: v.composition.trim(),
            price: v.is_preorder ? 0 : v.price,
            is_preorder: v.is_preorder,
            image_url: variantImageUrls[idx],
            sort_order: v.sort_order,
            is_active: true,
          })),
        };

        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const raw = await res.text();
        let data: { error?: string } = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          console.error("[admin/products] POST failed: non-JSON response", res.status, raw.slice(0, 200));
          setCreateError(res.status === 500 ? "Сервер вернул ошибку. Проверьте терминал (логи сервера)." : `Ошибка ${res.status}`);
          setCreateLoading(false);
          return;
        }
        if (!res.ok) {
          const msg = data?.error ?? "Ошибка создания";
          console.error("[admin/products] POST failed:", res.status, data);
          setCreateError(msg);
          setCreateLoading(false);
          return;
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
        <h2 className="text-xl font-semibold text-[#111]">Товары</h2>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Поиск по названию или slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm w-64 text-[#111]"
          />
          <button
            type="button"
            onClick={() => {
              productImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
              setProductImages([]);
              setProductImagesMainIndex(0);
              setSelectedCategorySlugs([]);
              setCreateIsHidden(false);
              setCreateIsPreorder(false);
              setCreateForm(initialForm);
              setCreateError("");
              setFieldErrors({});
              variants.forEach((v) => {
                if (v.image) URL.revokeObjectURL(v.image.previewUrl);
              });
              setVariants([]);
              setExpandedVariants(new Set());
              if (variantMainImage) URL.revokeObjectURL(variantMainImage.previewUrl);
              setVariantMainImage(null);
              setCreateModalOpen(true);
            }}
            className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f]"
          >
            Добавить
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full rounded-xl border border-[#2E7D32] bg-white shadow-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-white">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Фото</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Название</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Slug</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Тип</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Цена</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Статус</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-12 w-12 object-cover rounded" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-200" />
                  )}
                </td>
                <td className="px-4 py-2 font-medium text-[#111]">{p.name}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{p.slug}</td>
                <td className="px-4 py-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-[#111]">
                    {p.type === "simple" ? "Простой" : "С вариантами"}
                  </span>
                </td>
                <td className="px-4 py-2">{p.price?.toLocaleString("ru-RU")} ₽</td>
                <td className="px-4 py-2">
                  {p.is_hidden ? (
                    <span className="text-gray-400">Скрыт</span>
                  ) : p.is_preorder ? (
                    <span className="text-amber-600">Предзаказ</span>
                  ) : (
                    <span className="text-[#2E7D32]">Активен</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-[#2E7D32] hover:underline text-sm"
                  >
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="text-gray-500 py-8 text-center">Нет товаров. Нажмите «Добавить».</p>
        )}
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeCreateModal}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-product-title"
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-[#2E7D32] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleCreateSubmit} className="flex flex-col min-h-0">
              <div className="relative flex items-center justify-center px-6 py-3 border-b border-gray-200">
                <h3 id="create-product-title" className="font-medium text-[#111]">Новый товар</h3>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  aria-label="Закрыть"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-[#111]"
                >
                  <span className="sr-only">Закрыть</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3">
                {createError && (
                  <p className="text-sm text-red-600" role="alert">
                    {createError}
                  </p>
                )}
                <div>
                  <span className="block text-sm font-medium text-[#111] mb-1.5">Тип товара</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="createType"
                        value="simple"
                        checked={createType === "simple"}
                        onChange={() => setCreateType("simple")}
                      />
                      <span className="text-sm text-[#111]">Обычный</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="createType"
                        value="variant"
                        checked={createType === "variant"}
                        onChange={() => setCreateType("variant")}
                      />
                      <span className="text-sm text-[#111]">Варианты</span>
                    </label>
                  </div>
                  {fieldErrors.type && (
                    <p className="mt-0.5 text-xs text-red-600">{fieldErrors.type}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Название</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-[#111]"
                    required
                    autoFocus
                  />
                  {fieldErrors.name && (
                    <p className="mt-0.5 text-xs text-red-600">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Описание</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-[#111]"
                    rows={3}
                  />
                  {fieldErrors.description && (
                    <p className="mt-0.5 text-xs text-red-600">{fieldErrors.description}</p>
                  )}
                </div>
                {createType === "simple" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">Изображения</label>
                      <p className="text-xs text-gray-500 mb-1.5">
                        Максимум 5 файлов. Первое изображение — главное, используется на витрине. Перетаскивайте для изменения порядка.
                      </p>
                      <input
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES}
                        multiple
                        onChange={(e) => addProductImages(e.target.files)}
                        disabled={productImages.length >= MAX_IMAGES}
                        className="block w-full text-sm text-[#111] file:mr-2 file:rounded file:border-0 file:bg-[#819570] file:px-3 file:py-1.5 file:text-white file:hover:bg-[#6f7f5f]"
                      />
                      {fieldErrors.images && (
                        <p className="mt-0.5 text-xs text-red-600">{fieldErrors.images}</p>
                      )}
                      {productImages.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {productImages.map((item, index) => (
                            <div
                              key={index}
                              data-index={index}
                              draggable
                              onDragStart={() => setProductImagesDraggedIndex(index)}
                              onDragOver={(ev) => ev.preventDefault()}
                              onDrop={(ev) => {
                                ev.preventDefault();
                                const toIndex = parseInt(
                                  (ev.currentTarget.getAttribute("data-index") ?? "0"),
                                  10
                                );
                                if (productImagesDraggedIndex !== null && productImagesDraggedIndex !== toIndex) {
                                  reorderProductImages(productImagesDraggedIndex, toIndex);
                                }
                                setProductImagesDraggedIndex(null);
                              }}
                              onDragEnd={() => setProductImagesDraggedIndex(null)}
                              className={`relative w-24 h-24 flex-shrink-0 rounded-lg border-2 overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing ${
                                productImagesDraggedIndex === index
                                  ? "border-[#819570] opacity-80"
                                  : "border-gray-200"
                              }`}
                            >
                              <img
                                src={item.previewUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {productImagesMainIndex === index && (
                                <span className="absolute bottom-0 left-0 right-0 bg-[#819570] text-white text-xs text-center py-0.5">
                                  Главное
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setProductImageMain(index)}
                                title="Сделать главным"
                                className="absolute top-1 left-1 w-6 h-6 rounded bg-white/90 flex items-center justify-center text-xs hover:bg-white"
                              >
                                ★
                              </button>
                              <button
                                type="button"
                                onClick={() => removeProductImage(index)}
                                title="Удалить"
                                className="absolute top-1 right-1 w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center hover:bg-red-600 text-sm leading-none"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">Состав и размер</label>
                      <textarea
                        value={createForm.composition_size}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, composition_size: e.target.value }))
                        }
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-[#111]"
                        rows={3}
                        placeholder="Состав букета и размер"
                      />
                      <p className="mt-0.5 text-xs text-gray-500">
                        Вручную укажите состав и размер букета.
                      </p>
                      {fieldErrors.composition_size && (
                        <p className="mt-0.5 text-xs text-red-600">{fieldErrors.composition_size}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">Цена (₽)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={createForm.price || ""}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))
                        }
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        className="w-32 rounded border border-gray-300 px-3 py-1.5 text-sm text-[#111] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                      />
                      {fieldErrors.price && (
                        <p className="mt-0.5 text-xs text-red-600">{fieldErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">Категории</label>
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500">Нет активных категорий.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-4 border border-gray-200 rounded-lg divide-x divide-gray-200 max-h-40 overflow-y-auto">
                          {[0, 1].map((col) => {
                            const mid = Math.ceil(categories.length / 2);
                            const list = col === 0 ? categories.slice(0, mid) : categories.slice(mid);
                            return (
                              <ul key={col} className="divide-y divide-gray-100">
                                {list.map((cat) => (
                                  <li key={cat.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      id={`cat-${cat.slug}`}
                                      checked={selectedCategorySlugs.includes(cat.slug)}
                                      onChange={() => toggleCategorySlug(cat.slug)}
                                      className="rounded border-gray-300 text-[#819570] focus:ring-[#819570]"
                                    />
                                    <label htmlFor={`cat-${cat.slug}`} className="text-sm text-[#111] cursor-pointer flex-1">
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
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createIsHidden}
                          onChange={(e) => setCreateIsHidden(e.target.checked)}
                          className="rounded border-gray-300 text-[#819570] focus:ring-[#819570]"
                        />
                        <span className="text-sm text-[#111]">Скрыть с витрины</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createIsPreorder}
                          onChange={(e) => setCreateIsPreorder(e.target.checked)}
                          className="rounded border-gray-300 text-[#819570] focus:ring-[#819570]"
                        />
                        <span className="text-sm text-[#111]">Предзаказ</span>
                      </label>
                    </div>
                    <div className="space-y-0.5 text-xs text-gray-500">
                      <p>«Скрыть с витрины» — товар не показывается на сайте, но остаётся в админке.</p>
                      <p>«Предзаказ» — товар виден на витрине, вместо цены отображается текст «Предзаказ».</p>
                    </div>
                  </>
                )}
                {createType === "variant" && (
                  <>
                    {/* Блок вариантов */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-[#111]">Варианты</label>
                        <button
                          type="button"
                          onClick={addVariant}
                          className="text-sm px-3 py-1 rounded bg-[#819570] text-white hover:bg-[#6f7f5f]"
                        >
                          Добавить вариант
                        </button>
                      </div>
                      {fieldErrors.variants && (
                        <p className="mb-2 text-xs text-red-600">{fieldErrors.variants}</p>
                      )}
                      {variants.length === 0 && (
                        <p className="text-sm text-gray-500 py-3 text-center border border-gray-200 rounded">
                          Нет вариантов. Нажмите «Добавить вариант».
                        </p>
                      )}
                      {variants.length > 0 && (
                        <div className="space-y-2">
                          {variants.map((variant, idx) => {
                            const isExpanded = expandedVariants.has(variant.id);
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
                                className={`border rounded-lg bg-[#fafafa] ${
                                  variantsDraggedIndex === idx ? "border-[#819570] opacity-80" : "border-gray-200"
                                }`}
                              >
                                {/* Шапка варианта (всегда видна) */}
                                <div
                                  className="flex items-center gap-2 px-2.5 py-2 cursor-pointer select-none"
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
                                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 px-0.5"
                                    title="Перетащить"
                                  >
                                    ⋮⋮
                                  </span>
                                  {/* Стрелка */}
                                  <span className="text-gray-400 text-xs w-3">
                                    {isExpanded ? "▼" : "▶"}
                                  </span>
                                  {/* Название и инфо */}
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <span className="text-sm font-medium text-[#111] truncate">
                                      {variant.name || `Вариант ${idx + 1}`}
                                    </span>
                                    {variant.is_preorder ? (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                        Предзаказ
                                      </span>
                                    ) : variant.price > 0 ? (
                                      <span className="text-xs text-gray-500">
                                        {variant.price.toLocaleString("ru-RU")} ₽
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Контент варианта (только если развернут) */}
                                {isExpanded && (
                                  <div className="px-2.5 pb-2.5 pt-1 space-y-2 border-t border-gray-100">
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Название варианта"
                                        value={variant.name}
                                        onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-[#111]"
                                      />
                                      {fieldErrors[`variant_${idx}_name`] && (
                                        <p className="mt-0.5 text-xs text-red-600">{fieldErrors[`variant_${idx}_name`]}</p>
                                      )}
                                    </div>
                                    <div>
                                      <textarea
                                        placeholder="Состав и размер"
                                        value={variant.composition}
                                        onChange={(e) => updateVariant(variant.id, { composition: e.target.value })}
                                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-[#111]"
                                        rows={2}
                                      />
                                      {fieldErrors[`variant_${idx}_composition`] && (
                                        <p className="mt-0.5 text-xs text-red-600">{fieldErrors[`variant_${idx}_composition`]}</p>
                                      )}
                                    </div>
                                    <div className="flex gap-2 items-start">
                                      <div className="flex-1">
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
                                          disabled={variant.is_preorder}
                                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-[#111] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-gray-100"
                                        />
                                        {fieldErrors[`variant_${idx}_price`] && (
                                          <p className="mt-0.5 text-xs text-red-600">{fieldErrors[`variant_${idx}_price`]}</p>
                                        )}
                                      </div>
                                      <label className="flex items-center gap-1 pt-1">
                                        <input
                                          type="checkbox"
                                          checked={variant.is_preorder}
                                          onChange={(e) =>
                                            updateVariant(variant.id, { is_preorder: e.target.checked })
                                          }
                                          className="rounded border-gray-300 text-[#819570] focus:ring-[#819570]"
                                        />
                                        <span className="text-xs text-[#111]">Предзаказ</span>
                                      </label>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">Фото варианта</label>
                                      {!variant.image ? (
                                        <input
                                          type="file"
                                          accept={ALLOWED_IMAGE_TYPES}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) addVariantImage(variant.id, file);
                                          }}
                                          className="block w-full text-xs text-[#111] file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-[#111] file:hover:bg-gray-300"
                                        />
                                      ) : (
                                        <div className="relative w-16 h-16 rounded border border-gray-200 overflow-hidden">
                                          <img
                                            src={variant.image.previewUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeVariantImage(variant.id)}
                                            className="absolute top-0 right-0 w-4 h-4 rounded-bl bg-red-500/80 text-white flex items-center justify-center hover:bg-red-600 text-xs leading-none"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    {/* Кнопка удаления — только в развернутом состоянии */}
                                    <div className="pt-1 border-t border-gray-100">
                                      <button
                                        type="button"
                                        onClick={() => removeVariant(variant.id)}
                                        className="text-xs text-gray-500 hover:text-red-600"
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

                    {/* Главное фото товара */}
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">Главное фото товара</label>
                      <p className="text-xs text-gray-500 mb-1.5">
                        Это фото используется как главное изображение товара на витрине.
                      </p>
                      {!variantMainImage ? (
                        <input
                          type="file"
                          accept={ALLOWED_IMAGE_TYPES}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setMainImageForVariantProduct(file);
                          }}
                          className="block w-full text-sm text-[#111] file:mr-2 file:rounded file:border-0 file:bg-[#819570] file:px-3 file:py-1.5 file:text-white file:hover:bg-[#6f7f5f]"
                        />
                      ) : (
                        <div className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden">
                          <img
                            src={variantMainImage.previewUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeMainImageForVariantProduct}
                            className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-red-500/80 text-white flex items-center justify-center hover:bg-red-600 text-xs leading-none"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      {fieldErrors.variantMainImage && (
                        <p className="mt-0.5 text-xs text-red-600">{fieldErrors.variantMainImage}</p>
                      )}
                    </div>

                    {/* Категории */}
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">Категории</label>
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500">Нет активных категорий.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-4 border border-gray-200 rounded-lg divide-x divide-gray-200 max-h-40 overflow-y-auto">
                          {[0, 1].map((col) => {
                            const mid = Math.ceil(categories.length / 2);
                            const list = col === 0 ? categories.slice(0, mid) : categories.slice(mid);
                            return (
                              <ul key={col} className="divide-y divide-gray-100">
                                {list.map((cat) => (
                                  <li key={cat.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      id={`cat-${cat.slug}`}
                                      checked={selectedCategorySlugs.includes(cat.slug)}
                                      onChange={() => toggleCategorySlug(cat.slug)}
                                      className="rounded border-gray-300 text-[#819570] focus:ring-[#819570]"
                                    />
                                    <label htmlFor={`cat-${cat.slug}`} className="text-sm text-[#111] cursor-pointer flex-1">
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

                    {/* Скрыть с витрины */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createIsHidden}
                          onChange={(e) => setCreateIsHidden(e.target.checked)}
                          className="rounded border-gray-300 text-[#819570] focus:ring-[#819570]"
                        />
                        <span className="text-sm text-[#111]">Скрыть с витрины</span>
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        Товар не показывается на сайте, но остаётся в админке.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 px-6 py-3 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={createLoading || productImagesUploading}
                  className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f] disabled:opacity-50"
                >
                  {productImagesUploading
                    ? "Загрузка изображений…"
                    : createLoading
                      ? "Создание…"
                      : "Создать"}
                </button>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
