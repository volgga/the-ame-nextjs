"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { slugify } from "@/utils/slugify";
import { ProductsList } from "@/components/admin/products/ProductsList";

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
  image: ImageItem | null;
  imageUrl?: string | null; // existing image URL (for edit)
  sort_order: number;
};

const initialForm = {
  name: "",
  description: "",
  composition_size: "",
  height_cm: null as number | null,
  width_cm: null as number | null,
  price: 0,
};

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
  const [productImagesDraggedIndex, setProductImagesDraggedIndex] = useState<number | null>(null);
  const [productImagesUploading, setProductImagesUploading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; is_active: boolean }[]>([]);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [createIsHidden, setCreateIsHidden] = useState(false);
  const [createIsPreorder, setCreateIsPreorder] = useState(false);
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
  const [variantMainImage, setVariantMainImage] = useState<ImageItem | null>(null);
  // Множество id развернутых вариантов (первый добавленный — развернут по умолчанию)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  // ID вариантов при открытии редактирования (для удаления удалённых в UI)
  const [initialVariantIds, setInitialVariantIds] = useState<number[]>([]);

  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [deleteConfirmProductId, setDeleteConfirmProductId] = useState<string | null>(null);

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
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_hidden: data.is_hidden ?? !p.is_hidden } : x))
      );
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
        });
        setCreateIsHidden(data.is_hidden ?? false);
        setCreateIsPreorder(data.is_preorder ?? false);
        setSelectedCategorySlugs(
          Array.isArray(data.category_slugs) ? data.category_slugs : data.category_slug ? [data.category_slug] : []
        );
        if (isVariantProduct) {
          setExistingMainImageUrl(data.image_url ?? null);
          setVariantMainImage(null);
          setExistingImageUrls([]);
          setProductImages([]);
          setProductImagesMainIndex(0);
          const rawVariants = data.variants ?? [];
          setInitialVariantIds(rawVariants.map((v: { id?: number }) => v.id).filter((id: unknown): id is number => typeof id === "number"));
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
                image_url?: string | null;
              },
              idx: number
            ) => ({
              id: v.id,
              name: v.name ?? v.title ?? v.size ?? `Вариант ${idx + 1}`,
              composition: v.composition ?? "",
              height_cm: v.height_cm != null ? Number(v.height_cm) : null,
              width_cm: v.width_cm != null ? Number(v.width_cm) : null,
              price: Number(v.price ?? 0),
              is_preorder: v.is_preorder ?? false,
              image: null,
              imageUrl: v.image_url ?? null,
              sort_order: idx,
            })
          );
          setVariants(vars);
          setExpandedVariants(new Set(vars.map((v: Variant) => String(v.id))));
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
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить."
    );
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

  function closeCreateModal() {
    productImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setProductImages([]);
    setProductImagesMainIndex(0);
    setExistingImageUrls([]);
    setExistingMainImageUrl(null);
    setEditProductId(null);
    setSelectedCategorySlugs([]);
    setCreateIsHidden(false);
    setCreateIsPreorder(false);
    setFieldErrors({});
    setCreateModalOpen(false);
    setCreateForm(initialForm);
    setCreateError("");
    setInitialVariantIds([]);
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
      if (!composition) errors.composition_size = "Введите состав";
      const totalImages = existingImageUrls.length + productImages.length;
      if (totalImages === 0) errors.images = "Загрузите хотя бы одно фото";
      if (selectedCategorySlugs.length === 0) errors.categories = "Выберите минимум одну категорию";
      const price = createForm.price;
      if (typeof price !== "number" || price <= 0) errors.price = "Цена должна быть больше 0";
    }

    if (createType === "variant") {
      if (!variantMainImage && !existingMainImageUrl) errors.variantMainImage = "Загрузите главное фото товара";
      if (selectedCategorySlugs.length === 0) errors.categories = "Выберите минимум одну категорию";
      if (variants.length === 0) errors.variants = "Добавьте хотя бы один вариант";

      // Валидация каждого варианта (состав/размер не обязательны)
      variants.forEach((v, idx) => {
        if (!v.name.trim()) errors[`variant_${idx}_name`] = "Введите название варианта";
        if (!v.is_preorder && (typeof v.price !== "number" || v.price <= 0)) {
          errors[`variant_${idx}_price`] = "Цена должна быть больше 0";
        }
      });
    }

    return errors;
  }

  function toggleCategorySlug(slug: string) {
    setSelectedCategorySlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function addProductImages(files: FileList | null) {
    if (!files?.length) return;
    const allowed = Array.from(files).filter((f) => ALLOWED_IMAGE_TYPES.split(",").some((t) => f.type === t.trim()));
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
      height_cm: null,
      width_cm: null,
      price: 0,
      is_preorder: false,
      image: null,
      sort_order: variants.length,
    };
    setVariants((prev) => [...prev, newVariant]);
    // Первый вариант развернут по умолчанию, остальные — свернуты
    if (variants.length === 0) {
      setExpandedVariants(new Set([String(newVariant.id)]));
    }
  }

  function removeVariant(id: string | number) {
    setVariants((prev) => {
      const variant = prev.find((v) => v.id === id);
      if (variant?.image) URL.revokeObjectURL(variant.image.previewUrl);
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

  function addVariantImage(id: string | number, file: File) {
    const variant = variants.find((v) => v.id === id);
    if (variant?.image) URL.revokeObjectURL(variant.image.previewUrl);
    updateVariant(id, { image: { file, previewUrl: URL.createObjectURL(file) } });
  }

  function removeVariantImage(id: string | number) {
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
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Ошибка загрузки изображения");
            uploadedUrls.push(data.image_url);
          }
          setProductImagesUploading(false);
        }
        const allUrls = [...existingImageUrls, ...uploadedUrls];
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
          images: otherUrls.length > 0 ? otherUrls : null,
          is_active: true,
          is_hidden: createIsHidden,
          is_preorder: createIsPreorder,
          category_slug: selectedCategorySlugs[0] || null,
          category_slugs: selectedCategorySlugs,
        };
        const url = `/api/admin/products/${editProductId}`;
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log("EDIT payload (simple)", payload);
          // eslint-disable-next-line no-console
          console.log("EDIT method/url", "PATCH", url);
        }
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data?.fieldErrors && typeof data.fieldErrors === "object") {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(data.fieldErrors)) {
              flat[k] = Array.isArray(v) ? v[0] : String(v);
            }
            setFieldErrors(flat);
          }
          throw new Error(data?.error ?? "Ошибка сохранения");
        }
        closeCreateModal();
        load();
      } else {
        let mainImageUrl: string | null = existingMainImageUrl;
        if (variantMainImage) {
          setProductImagesUploading(true);
          const formData = new FormData();
          formData.append("file", variantMainImage.file);
          const res = await fetch("/api/admin/products/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error ?? "Ошибка загрузки главного фото");
          mainImageUrl = data.image_url;
          setProductImagesUploading(false);
        }
        const payload = {
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          image_url: mainImageUrl,
          is_active: true,
          is_hidden: createIsHidden,
          category_slug: selectedCategorySlugs[0] || null,
          category_slugs: selectedCategorySlugs,
        };
        const url = `/api/admin/products/${editProductId}`;
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log("EDIT payload (variant header)", payload);
          // eslint-disable-next-line no-console
          console.log("EDIT method/url", "PATCH", url);
        }
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const patchData = await res.json();
        if (!res.ok) {
          if (patchData?.fieldErrors && typeof patchData.fieldErrors === "object") {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(patchData.fieldErrors)) {
              flat[k] = Array.isArray(v) ? v[0] : String(v);
            }
            setFieldErrors(flat);
          }
          throw new Error(patchData?.error ?? "Ошибка сохранения товара");
        }
        const currentVariantIds = variants.filter((v) => typeof v.id === "number").map((v) => v.id as number);
        const toDeleteIds = initialVariantIds.filter((id) => !currentVariantIds.includes(id));
        for (const variantId of toDeleteIds) {
          const delRes = await fetch(`/api/admin/products/${editProductId}/variants/${variantId}`, {
            method: "DELETE",
          });
          if (!delRes.ok) {
            const delData = await delRes.json().catch(() => ({}));
            throw new Error(delData?.error ?? "Ошибка удаления варианта");
          }
        }
        for (const v of variants) {
          if (typeof v.id === "number") {
            let variantImageUrl: string | null = v.imageUrl ?? null;
            if (v.image) {
              const formData = new FormData();
              formData.append("file", v.image.file);
              const upRes = await fetch("/api/admin/products/upload", { method: "POST", body: formData });
              const upData = await upRes.json();
              if (!upRes.ok) throw new Error(upData?.error ?? "Ошибка загрузки фото варианта");
              variantImageUrl = upData.image_url;
            }
            const vRes = await fetch(`/api/admin/products/${editProductId}/variants/${v.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                size: v.name.trim(),
                composition: v.composition.trim() || null,
                height_cm: v.height_cm ?? null,
                width_cm: v.width_cm ?? null,
                price: v.is_preorder ? 0 : v.price,
                is_preorder: v.is_preorder,
                image_url: variantImageUrl,
                sort_order: v.sort_order,
              }),
            });
            if (!vRes.ok) {
              const vData = await vRes.json();
              throw new Error(vData?.error ?? "Ошибка сохранения варианта");
            }
          } else {
            let variantImageUrl: string | null = null;
            if (v.image) {
              const formData = new FormData();
              formData.append("file", v.image.file);
              const upRes = await fetch("/api/admin/products/upload", { method: "POST", body: formData });
              const upData = await upRes.json();
              if (!upRes.ok) throw new Error(upData?.error ?? "Ошибка загрузки фото варианта");
              variantImageUrl = upData.image_url;
            }
            const vRes = await fetch(`/api/admin/products/${editProductId}/variants`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                size: v.name.trim(),
                composition: v.composition.trim() || null,
                height_cm: v.height_cm ?? null,
                width_cm: v.width_cm ?? null,
                price: v.is_preorder ? 0 : v.price,
                is_preorder: v.is_preorder,
                image_url: variantImageUrl,
                sort_order: v.sort_order,
                is_active: true,
              }),
            });
            if (!vRes.ok) {
              const vData = await vRes.json();
              throw new Error(vData?.error ?? "Ошибка добавления варианта");
            }
          }
        }
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
            ? [...imageUrls.slice(0, productImagesMainIndex), ...imageUrls.slice(productImagesMainIndex + 1)]
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
        let data: { error?: string; fieldErrors?: Record<string, string[]> } = {};
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
            composition: v.composition.trim() || null,
            height_cm: v.height_cm ?? null,
            width_cm: v.width_cm ?? null,
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
        let data: { error?: string; fieldErrors?: Record<string, string[]> } = {};
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
        <h2 className="text-xl font-semibold text-color-text-main">Товары</h2>
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
              variants.forEach((v) => {
                if (v.image) URL.revokeObjectURL(v.image.previewUrl);
              });
              setVariants([]);
              setExpandedVariants(new Set());
              if (variantMainImage) URL.revokeObjectURL(variantMainImage.previewUrl);
              setVariantMainImage(null);
              setCreateModalOpen(true);
            }}
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
          >
            Добавить
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {products.length === 0 ? (
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

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeCreateModal} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-product-title"
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white shadow-xl hover:border-border-block-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editProductId != null) {
                  handleEditSubmit(e);
                } else {
                  handleCreateSubmit(e);
                }
              }}
              className="flex flex-col min-h-0"
            >
              <div className="relative flex items-center justify-center px-6 py-3 border-b border-border-block">
                <h3 id="create-product-title" className="font-medium text-color-text-main">
                  {isEditMode ? "Редактировать товар" : "Новый товар"}
                </h3>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  aria-label="Закрыть"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-color-text-secondary hover:bg-[rgba(31,42,31,0.08)] hover:text-color-text-main"
                >
                  <span className="sr-only">Закрыть</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3">
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
                    autoFocus
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
                  {fieldErrors.description && <p className="mt-0.5 text-xs text-red-600">{fieldErrors.description}</p>}
                </div>
                {createType === "simple" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-color-text-main mb-1">Изображения</label>
                      <p className="text-xs text-color-text-secondary mb-1.5">
                        Максимум 5 файлов. Первое изображение — главное, используется на витрине. Перетаскивайте для
                        изменения порядка.
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
                      {(existingImageUrls.length > 0 || productImages.length > 0) && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {existingImageUrls.map((url, index) => (
                            <div
                              key={`existing-${index}`}
                              className="relative w-24 h-24 flex-shrink-0 rounded-lg border-2 overflow-hidden bg-[rgba(31,42,31,0.04)] border-border-block"
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {productImagesMainIndex === index && (
                                <span className="absolute bottom-0 left-0 right-0 bg-accent-btn text-white text-xs text-center py-0.5">
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
                                onClick={() => removeExistingImage(index)}
                                title="Удалить"
                                className="absolute top-1 right-1 w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center hover:bg-red-600 text-sm leading-none"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {productImages.map((item, index) => {
                            const combinedIndex = existingImageUrls.length + index;
                            return (
                              <div
                                key={`file-${index}`}
                                data-index={index}
                                draggable
                                onDragStart={() => setProductImagesDraggedIndex(index)}
                                onDragOver={(ev) => ev.preventDefault()}
                                onDrop={(ev) => {
                                  ev.preventDefault();
                                  const toIndex = parseInt(ev.currentTarget.getAttribute("data-index") ?? "0", 10);
                                  if (productImagesDraggedIndex !== null && productImagesDraggedIndex !== toIndex) {
                                    reorderProductImages(productImagesDraggedIndex, toIndex);
                                  }
                                  setProductImagesDraggedIndex(null);
                                }}
                                onDragEnd={() => setProductImagesDraggedIndex(null)}
                                className={`relative w-24 h-24 flex-shrink-0 rounded-lg border-2 overflow-hidden bg-[rgba(31,42,31,0.04)] cursor-grab active:cursor-grabbing ${
                                  productImagesDraggedIndex === index
                                    ? "border-color-text-main opacity-80"
                                    : "border-border-block"
                                }`}
                              >
                                <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                                {productImagesMainIndex === combinedIndex && (
                                  <span className="absolute bottom-0 left-0 right-0 bg-accent-btn text-white text-xs text-center py-0.5">
                                    Главное
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setProductImageMain(combinedIndex)}
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
                            );
                          })}
                        </div>
                      )}
                    </div>
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
                    <div>
                      <label className="block text-sm font-medium text-color-text-main mb-1">Категории</label>
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
                    </div>
                    <div className="space-y-0.5 text-xs text-color-text-secondary">
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
                                    className="cursor-grab active:cursor-grabbing text-color-text-secondary hover:text-color-text-main px-0.5"
                                    title="Перетащить"
                                  >
                                    ⋮⋮
                                  </span>
                                  {/* Стрелка */}
                                  <span className="text-color-text-secondary text-xs w-3">
                                    {isExpanded ? "▼" : "▶"}
                                  </span>
                                  {/* Название и инфо */}
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <span className="text-sm font-medium text-color-text-main truncate">
                                      {variant.name || `Вариант ${idx + 1}`}
                                    </span>
                                    {variant.is_preorder ? (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(111,131,99,0.2)] text-color-bg-main">
                                        Предзаказ
                                      </span>
                                    ) : variant.price > 0 ? (
                                      <span className="text-xs text-color-text-secondary">
                                        {variant.price.toLocaleString("ru-RU")} ₽
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Контент варианта (только если развернут) */}
                                {isExpanded && (
                                  <div className="px-2.5 pb-2.5 pt-1 space-y-2 border-t border-border-block">
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
                                      <label className="block text-xs text-color-text-main mb-0.5">Состав</label>
                                      <textarea
                                        placeholder="Розы 7 шт, Тюльпаны 8 шт, Гипсофила…"
                                        value={variant.composition}
                                        onChange={(e) => updateVariant(variant.id, { composition: e.target.value })}
                                        className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                                        rows={2}
                                      />
                                      <p className="mt-0.5 text-xs text-color-text-secondary">
                                        Укажите состав букета вручную
                                      </p>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-color-text-main mb-0.5">Размер</label>
                                      <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                          <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={variant.height_cm ?? ""}
                                            onChange={(e) =>
                                              updateVariant(variant.id, {
                                                height_cm:
                                                  e.target.value === "" ? null : parseInt(e.target.value, 10) || null,
                                              })
                                            }
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            placeholder="45"
                                            className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          <span className="text-xs text-color-text-secondary block">Высота, см</span>
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
                                                  e.target.value === "" ? null : parseInt(e.target.value, 10) || null,
                                              })
                                            }
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            placeholder="40"
                                            className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          <span className="text-xs text-color-text-secondary block">Ширина, см</span>
                                        </div>
                                      </div>
                                      <p className="mt-0.5 text-xs text-color-text-secondary">
                                        Размер букета в сантиметрах
                                      </p>
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
                                          className="w-full rounded border border-border-block bg-white px-2 py-1 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-[rgba(31,42,31,0.06)]"
                                        />
                                        {fieldErrors[`variant_${idx}_price`] && (
                                          <p className="mt-0.5 text-xs text-red-600">
                                            {fieldErrors[`variant_${idx}_price`]}
                                          </p>
                                        )}
                                      </div>
                                      <label className="flex items-center gap-1 pt-1">
                                        <input
                                          type="checkbox"
                                          checked={variant.is_preorder}
                                          onChange={(e) => updateVariant(variant.id, { is_preorder: e.target.checked })}
                                          className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                                        />
                                        <span className="text-xs text-color-text-main">Предзаказ</span>
                                      </label>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-color-text-secondary mb-1">
                                        Фото варианта
                                      </label>
                                      {variant.image ? (
                                        <div className="relative w-16 h-16 rounded border border-border-block overflow-hidden">
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
                                      ) : variant.imageUrl ? (
                                        <div className="relative w-16 h-16 rounded border border-border-block overflow-hidden">
                                          <img src={variant.imageUrl} alt="" className="w-full h-full object-cover" />
                                          <input
                                            type="file"
                                            accept={ALLOWED_IMAGE_TYPES}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) addVariantImage(variant.id, file);
                                            }}
                                            className="mt-1 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-accent-btn file:px-2 file:py-1 file:text-white file:hover:bg-accent-btn-hover"
                                          />
                                        </div>
                                      ) : (
                                        <input
                                          type="file"
                                          accept={ALLOWED_IMAGE_TYPES}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) addVariantImage(variant.id, file);
                                          }}
                                          className="block w-full text-xs text-color-text-main file:mr-2 file:rounded file:border-0 file:border-border-block file:bg-white file:px-2 file:py-1 file:text-color-text-main file:hover:bg-[rgba(31,42,31,0.08)]"
                                        />
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

                    {/* Главное фото товара */}
                    <div>
                      <label className="block text-sm font-medium text-color-text-main mb-1">Главное фото товара</label>
                      <p className="text-xs text-color-text-secondary mb-1.5">
                        Это фото используется как главное изображение товара на витрине.
                      </p>
                      {variantMainImage ? (
                        <div className="relative w-20 h-20 rounded-lg border border-border-block overflow-hidden">
                          <img src={variantMainImage.previewUrl} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removeMainImageForVariantProduct}
                            className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-red-500/80 text-white flex items-center justify-center hover:bg-red-600 text-xs leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ) : existingMainImageUrl ? (
                        <div className="relative w-20 h-20 rounded-lg border border-border-block overflow-hidden">
                          <img src={existingMainImageUrl} alt="" className="w-full h-full object-cover" />
                          <p className="text-xs text-color-text-secondary mt-1">Загрузите новый файл, чтобы заменить</p>
                          <input
                            type="file"
                            accept={ALLOWED_IMAGE_TYPES}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setMainImageForVariantProduct(file);
                            }}
                            className="mt-1 block w-full text-sm text-color-text-main file:mr-2 file:rounded file:border-0 file:bg-accent-btn file:px-3 file:py-1.5 file:text-white file:hover:bg-accent-btn-hover"
                          />
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept={ALLOWED_IMAGE_TYPES}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setMainImageForVariantProduct(file);
                          }}
                          className="block w-full text-sm text-color-text-main file:mr-2 file:rounded file:border-0 file:bg-accent-btn file:px-3 file:py-1.5 file:text-white file:hover:bg-accent-btn-hover focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
                        />
                      )}
                      {fieldErrors.variantMainImage && (
                        <p className="mt-0.5 text-xs text-red-600">{fieldErrors.variantMainImage}</p>
                      )}
                    </div>

                    {/* Категории */}
                    <div>
                      <label className="block text-sm font-medium text-color-text-main mb-1">Категории</label>
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

                    {/* Скрыть с витрины */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createIsHidden}
                          onChange={(e) => setCreateIsHidden(e.target.checked)}
                          className="rounded border-border-block text-color-bg-main focus:ring-[rgba(111,131,99,0.5)]"
                        />
                        <span className="text-sm text-color-text-main">Скрыть с витрины</span>
                      </label>
                      <p className="mt-1 text-xs text-color-text-secondary">
                        Товар не показывается на сайте, но остаётся в админке.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 px-6 py-3 border-t border-border-block">
                <button
                  type="submit"
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
            </form>
          </div>
        </div>
      )}

      {/* Мини-модалка подтверждения удаления (как в Категориях) */}
      {deleteConfirmProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmProductId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Точно удалить?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProductId(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-200"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFromList(deleteConfirmProductId)}
                className="rounded px-3 py-1.5 text-sm text-[#111] hover:bg-gray-50"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}
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
