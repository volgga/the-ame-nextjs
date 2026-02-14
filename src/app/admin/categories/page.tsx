"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/components/admin/categories/CategoryCard";
import type { Subcategory } from "@/types/admin";
import { slugify } from "@/utils/slugify";
import { FLOWERS_IN_COMPOSITION_CATEGORY_SLUG } from "@/lib/constants";
import { parseAdminResponse } from "@/lib/adminFetch";

const CategoriesGrid = dynamic(
  () => import("@/components/admin/categories/CategoriesGrid").then((m) => ({ default: m.CategoriesGrid })),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[100px] animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    ),
  }
);

function areOrdersEqual(a: Category[], b: Category[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c.id === b[i].id);
}

export default function AdminCategoriesPage() {
  const [categoriesFromServer, setCategoriesFromServer] = useState<Category[]>([]);
  const [categoriesDraft, setCategoriesDraft] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Состояние для подкатегорий
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    title: "",
    description: "",
    seo_title: "",
    seo_description: "",
  });
  const [deleteSubcategoryConfirmId, setDeleteSubcategoryConfirmId] = useState<string | null>(null);
  // Справочник "Цветы в составе" (таблица flowers) — только при редактировании категории "Цветы в составе"
  type FlowerItem = {
    id: string;
    slug: string;
    name: string;
    title?: string | null;
    description?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    is_active: boolean;
    sort_order: number;
  };
  const [flowersList, setFlowersList] = useState<FlowerItem[]>([]);
  const [flowersLoading, setFlowersLoading] = useState(false);
  const [flowersSyncLoading, setFlowersSyncLoading] = useState(false);
  const [editingFlower, setEditingFlower] = useState<FlowerItem | null>(null);
  const [flowerForm, setFlowerForm] = useState({
    name: "",
    title: "",
    description: "",
    seo_title: "",
    seo_description: "",
    is_active: true,
  });
  const [deleteFlowerConfirmId, setDeleteFlowerConfirmId] = useState<string | null>(null);
  const [deleteFlowerHardConfirmId, setDeleteFlowerHardConfirmId] = useState<string | null>(null);

  const isDirty = !areOrdersEqual(categoriesFromServer, categoriesDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = "/api/admin/categories";
      const res = await fetch(url);
      const result = await parseAdminResponse<any[]>(res, { method: "GET", url });
      if (!result.ok || !Array.isArray(result.data)) {
        const apiError =
          result.data && !Array.isArray(result.data) && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки";
        throw new Error(message);
      }
      const data = result.data;
      // Убеждаемся, что данные - массив и обрабатываем flower_sections
      const safeData = Array.isArray(data)
        ? data.map((cat: any) => ({
            ...cat,
            flower_sections: Array.isArray(cat.flower_sections) ? cat.flower_sections : null,
          }))
        : [];
      setCategoriesFromServer(safeData);
      setCategoriesDraft(safeData);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function closeModal() {
    setCreating(false);
    setEditing(null);
    setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
    setIsSlugManuallyEdited(false);
    setSubcategories([]);
    setEditingSubcategory(null);
    setCreatingSubcategory(false);
    setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
    setDeleteSubcategoryConfirmId(null);
    setFlowersList([]);
    setEditingFlower(null);
    setFlowerForm({ name: "", title: "", description: "", seo_title: "", seo_description: "", is_active: true });
    setDeleteFlowerConfirmId(null);
    setDeleteFlowerHardConfirmId(null);
  }

  const loadSubcategories = useCallback(async (categoryId: string) => {
    setSubcategoriesLoading(true);
    try {
      const url = `/api/admin/subcategories?category_id=${categoryId}`;
      const res = await fetch(url);
      const result = await parseAdminResponse<Subcategory[]>(res, { method: "GET", url });
      if (!result.ok || !Array.isArray(result.data)) {
        const apiError =
          result.data && !Array.isArray(result.data) && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки подкатегорий";
        throw new Error(message);
      }
      setSubcategories(result.data);
    } catch (e) {
      console.error("[admin/categories] Error loading subcategories:", e);
    } finally {
      setSubcategoriesLoading(false);
    }
  }, []);

  const loadFlowers = useCallback(async () => {
    setFlowersLoading(true);
    try {
      const url = "/api/admin/flowers";
      const res = await fetch(url);
      const result = await parseAdminResponse<FlowerItem[]>(res, { method: "GET", url });
      if (!result.ok || !Array.isArray(result.data)) {
        const apiError =
          result.data && !Array.isArray(result.data) && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки цветов";
        throw new Error(message);
      }
      setFlowersList(result.data);
    } catch (e) {
      console.error("[admin/categories] Error loading flowers:", e);
    } finally {
      setFlowersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (editing?.id && editing?.slug !== FLOWERS_IN_COMPOSITION_CATEGORY_SLUG) {
      loadSubcategories(editing.id);
    } else {
      setSubcategories([]);
    }
  }, [editing?.id, editing?.slug, loadSubcategories]);

  useEffect(() => {
    if (editing?.slug === FLOWERS_IN_COMPOSITION_CATEGORY_SLUG) {
      loadFlowers();
    } else {
      setFlowersList([]);
    }
  }, [editing?.slug, loadFlowers]);

  // Блокировка скролла страницы при открытой любой модалке
  const anyModalOpen =
    creating ||
    !!editing ||
    !!deleteConfirmId ||
    creatingSubcategory ||
    !!editingSubcategory ||
    !!deleteSubcategoryConfirmId ||
    !!editingFlower ||
    !!deleteFlowerConfirmId ||
    !!deleteFlowerHardConfirmId;
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;
    if (anyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [anyModalOpen]);

  useEffect(() => {
    if (!creating && !editing) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [creating, editing]);

  useEffect(() => {
    if (!deleteConfirmId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteConfirmId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [deleteConfirmId]);

  useEffect(() => {
    if (!creatingSubcategory && !editingSubcategory) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreatingSubcategory(false);
        setEditingSubcategory(null);
        setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [creatingSubcategory, editingSubcategory]);

  useEffect(() => {
    if (!deleteSubcategoryConfirmId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteSubcategoryConfirmId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [deleteSubcategoryConfirmId]);

  useEffect(() => {
    if (!editingFlower) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingFlower(null);
        setFlowerForm({ name: "", title: "", description: "", seo_title: "", seo_description: "", is_active: true });
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [editingFlower]);

  useEffect(() => {
    if (!deleteFlowerConfirmId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteFlowerConfirmId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [deleteFlowerConfirmId]);

  useEffect(() => {
    if (!deleteFlowerHardConfirmId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteFlowerHardConfirmId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [deleteFlowerHardConfirmId]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nameTrimmed = form.name.trim();
    const slugTrimmed = form.slug.trim();
    if (!nameTrimmed) {
      setError("Название категории обязательно.");
      return;
    }
    if (!slugTrimmed) {
      setError("Slug обязателен. Заполните slug или измените название.");
      return;
    }
    try {
      if (creating) {
        const url = "/api/admin/categories";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            slug: slugTrimmed,
            is_active: form.is_active,
            description: form.description.trim() || null,
            seo_title: form.seo_title.trim() || null,
          }),
        });
        const result = await parseAdminResponse<Category & { error?: string }>(res, {
          method: "POST",
          url,
        });
        if (!result.ok || !result.data) {
          const apiError = result.data && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
          const message = apiError
            ? `${apiError}${result.message ? ` (${result.message})` : ""}`
            : result.message ?? "Ошибка";
          throw new Error(message);
        }
        const data = result.data;
        const newCat = { ...data, sort_order: categoriesDraft.length };
        setCategoriesFromServer((s) => [...s, newCat].sort((a, b) => a.sort_order - b.sort_order));
        setCategoriesDraft((s) => [...s, newCat].sort((a, b) => a.sort_order - b.sort_order));
        setCreating(false);
        setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
        setIsSlugManuallyEdited(false);
      } else if (editing) {
        const url = `/api/admin/categories/${editing.id}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            slug: slugTrimmed,
            is_active: form.is_active,
            description: form.description.trim() || null,
            seo_title: form.seo_title.trim() || null,
          }),
        });
        const result = await parseAdminResponse<
          Category & { error?: string; description?: string | null; seo_title?: string | null }
        >(res, {
          method: "PATCH",
          url,
        });
        if (!result.ok || !result.data) {
          const apiError = result.data && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
          const message = apiError
            ? `${apiError}${result.message ? ` (${result.message})` : ""}`
            : result.message ?? "Ошибка";
          throw new Error(message);
        }
        const data = result.data;
        const updated = {
          ...editing,
          name: data.name,
          slug: data.slug ?? editing.slug,
          is_active: data.is_active,
          description: data.description ?? null,
          seo_title: data.seo_title ?? null,
        };
        setCategoriesFromServer((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setCategoriesDraft((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setEditing(null);
        setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
        setIsSlugManuallyEdited(false);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleToggleActive(cat: Category) {
    setTogglingId(cat.id);
    setError("");
    try {
      const url = `/api/admin/categories/${cat.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      const result = await parseAdminResponse<{ error?: string; is_active?: boolean }>(res, {
        method: "PATCH",
        url,
      });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка";
        throw new Error(message);
      }
      const data = result.data ?? {};
      const updated: Category = { ...cat, is_active: data.is_active !== undefined ? data.is_active : cat.is_active };
      setCategoriesFromServer((s) => s.map((x) => (x.id === cat.id ? updated : x)));
      setCategoriesDraft((s) => s.map((x) => (x.id === cat.id ? updated : x)));
    } catch (e) {
      setError(String(e));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      const nextDraft = categoriesDraft.filter((x) => x.id !== id);
      const withOrder = nextDraft.map((c, i) => ({ ...c, sort_order: i }));
      setCategoriesFromServer(withOrder);
      setCategoriesDraft(withOrder);
      setEditing(null);
      if (withOrder.length > 0) {
        const reorderUrl = "/api/admin/categories/reorder";
        const reorderRes = await fetch(reorderUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: withOrder.map((c, i) => ({ id: c.id, sort_order: i })),
          }),
        });
        const reorderResult = await parseAdminResponse<{ error?: string }>(reorderRes, {
          method: "POST",
          url: reorderUrl,
        });
        if (!reorderResult.ok) {
          const apiError =
            reorderResult.data && typeof reorderResult.data.error === "string"
              ? reorderResult.data.error
              : null;
          setError(
            apiError
              ? `${apiError}${reorderResult.message ? ` (${reorderResult.message})` : ""}`
              : reorderResult.message ?? "Порядок не обновлён"
          );
        }
      }
    } catch (e) {
      setError(String(e));
    }
  }

  // Функции для работы с подкатегориями
  async function handleSaveSubcategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.id) return;
    const nameTrimmed = subcategoryForm.name.trim();
    if (!nameTrimmed) {
      setError("Название подкатегории обязательно.");
      return;
    }
    try {
      if (creatingSubcategory) {
        const url = "/api/admin/subcategories";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: editing.id,
            name: nameTrimmed,
            title: subcategoryForm.title.trim() || null,
            description: subcategoryForm.description.trim() || null,
            seo_title: subcategoryForm.seo_title.trim() || null,
            seo_description: subcategoryForm.seo_description.trim() || null,
            sort_order: subcategories.length,
            is_active: true,
          }),
        });
        const result = await parseAdminResponse<Subcategory & { error?: string }>(res, {
          method: "POST",
          url,
        });
        if (!result.ok || !result.data) {
          const apiError = result.data && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
          const message = apiError
            ? `${apiError}${result.message ? ` (${result.message})` : ""}`
            : result.message ?? "Ошибка";
          throw new Error(message);
        }
        const data = result.data;
        setSubcategories((s) => [...s, data].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
        setCreatingSubcategory(false);
        setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
      } else if (editingSubcategory) {
        const url = `/api/admin/subcategories/${editingSubcategory.id}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameTrimmed,
            title: subcategoryForm.title.trim() || null,
            description: subcategoryForm.description.trim() || null,
            seo_title: subcategoryForm.seo_title.trim() || null,
            seo_description: subcategoryForm.seo_description.trim() || null,
          }),
        });
        const result = await parseAdminResponse<Subcategory & { error?: string }>(res, {
          method: "PATCH",
          url,
        });
        if (!result.ok || !result.data) {
          const apiError = result.data && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
          const message = apiError
            ? `${apiError}${result.message ? ` (${result.message})` : ""}`
            : result.message ?? "Ошибка";
          throw new Error(message);
        }
        const data = result.data;
        setSubcategories((s) =>
          s.map((x) => (x.id === editingSubcategory.id ? data : x)).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
        );
        setEditingSubcategory(null);
        setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeleteSubcategory(id: string) {
    setDeleteSubcategoryConfirmId(null);
    try {
      const res = await fetch(`/api/admin/subcategories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      setSubcategories((s) => s.filter((x) => x.id !== id));
      setEditingSubcategory(null);
    } catch (e) {
      setError(String(e));
    }
  }

  function handleMoveSubcategory(id: string, direction: "up" | "down") {
    const index = subcategories.findIndex((s) => s.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === subcategories.length - 1) return;

    const newSubcategories = [...subcategories];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newSubcategories[index], newSubcategories[newIndex]] = [
      newSubcategories[newIndex],
      newSubcategories[index],
    ];

    const updated = newSubcategories.map((s, i) => ({ ...s, sort_order: i }));
    setSubcategories(updated);

    Promise.all(
      updated.map((s, i) =>
        fetch(`/api/admin/subcategories/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: i }),
        })
      )
    ).catch((e) => {
      console.error("[admin/categories] Error reordering subcategories:", e);
      setError("Ошибка сохранения порядка подкатегорий");
    });
  }

  async function handleSyncFlowers() {
    setFlowersSyncLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/flowers/sync", { method: "POST" });
      if (!res.ok) throw new Error("Ошибка синхронизации");
      await loadFlowers();
    } catch (e) {
      setError(String(e));
    } finally {
      setFlowersSyncLoading(false);
    }
  }

  async function handleSaveFlower(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFlower) return;
    setError("");
    try {
      const url = `/api/admin/flowers/${editingFlower.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: flowerForm.name.trim() || undefined,
          title: flowerForm.title.trim() || null,
          description: flowerForm.description.trim() || null,
          seo_title: flowerForm.seo_title.trim() || null,
          seo_description: flowerForm.seo_description.trim() || null,
          is_active: flowerForm.is_active,
        }),
      });
      const result = await parseAdminResponse<FlowerItem & { error?: string }>(res, {
        method: "PATCH",
        url,
      });
      if (!result.ok || !result.data) {
        const apiError = result.data && typeof (result.data as any).error === "string"
          ? (result.data as any).error
          : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка сохранения";
        throw new Error(message);
      }
      const data = result.data;
      setFlowersList((prev) => prev.map((f) => (f.id === data.id ? data : f)));
      setEditingFlower(null);
      setFlowerForm({ name: "", title: "", description: "", seo_title: "", seo_description: "", is_active: true });
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeactivateFlower(id: string) {
    setDeleteFlowerConfirmId(null);
    try {
      const url = `/api/admin/flowers/${id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      const result = await parseAdminResponse<{ error?: string }>(res, { method: "PATCH", url });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка";
        throw new Error(message);
      }
      await loadFlowers();
      setEditingFlower(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeleteFlowerHard(id: string) {
    setDeleteFlowerHardConfirmId(null);
    try {
      const url = `/api/admin/flowers/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      const result = await parseAdminResponse<{ error?: string }>(res, { method: "DELETE", url });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка удаления";
        throw new Error(message);
      }
      await loadFlowers();
      setEditingFlower(null);
    } catch (e) {
      setError(String(e));
    }
  }

  function handleMoveFlower(id: string, direction: "up" | "down") {
    const index = flowersList.findIndex((f) => f.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === flowersList.length - 1) return;
    const newList = [...flowersList];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    const orderedIds = newList.map((f) => f.id);
    setFlowersList(newList.map((f, i) => ({ ...f, sort_order: i })));
    fetch("/api/admin/flowers/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordered_ids: orderedIds }),
    }).catch((e) => {
      console.error("[admin/categories] Error reordering flowers:", e);
      loadFlowers();
    });
  }

  function handleReorder(newOrder: Category[]) {
    setCategoriesDraft(newOrder);
  }

  async function handleSaveOrder() {
    if (!isDirty) return;
    setSaveStatus("saving");
    setError("");
    try {
      const items = categoriesDraft.map((c, i) => ({ id: c.id, sort_order: i }));
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = await parseAdminResponse(res, { method: "POST", url: "/api/admin/categories/reorder" });
      if (!result.ok || !result.isJson) {
        const errorMsg = result.data && typeof result.data === "object" && "error" in result.data 
          ? (result.data as any).error 
          : result.message ?? "Ошибка сохранения";
        throw new Error(errorMsg);
      }
      const withOrder = categoriesDraft.map((c, i) => ({ ...c, sort_order: i }));
      setCategoriesFromServer(withOrder);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setError(String(e));
      setSaveStatus("idle");
    }
  }

  if (error && !creating && !editing) return <p className="text-red-600">{error}</p>;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-28 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[100px] animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111]">Категории</h2>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
            setIsSlugManuallyEdited(false);
          }}
          className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
        >
          Добавить
        </button>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} aria-hidden />
          <div
            className="relative w-[calc(100vw-32px)] max-w-[1000px] max-h-[calc(100vh-80px)] flex flex-col overflow-hidden rounded-xl border border-border-block bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-[2] flex items-center justify-between py-3 px-4 sm:px-6 border-b border-border-block flex-shrink-0 bg-white">
              <h3 className="text-lg font-semibold text-[#111] truncate pr-2">{creating ? "Новая категория" : "Редактирование"}</h3>
              <button type="button" onClick={closeModal} className="p-1.5 rounded-full text-gray-500 hover:text-[#111] hover:bg-gray-100 flex-shrink-0" aria-label="Закрыть">×</button>
            </div>
            <form onSubmit={handleSaveForm} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6" style={{ overscrollBehavior: "contain" }}>
                {error && (creating || editing) && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название категории</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setForm((f) => ({
                          ...f,
                          name,
                          ...(isSlugManuallyEdited ? {} : { slug: slugify(name) }),
                        }));
                      }}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, slug: e.target.value }));
                        setIsSlugManuallyEdited(true);
                      }}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111] font-mono text-sm"
                      placeholder="vazy"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Автоматически из названия. Если измените вручную — дальнейшее изменение названия не перезапишет
                      slug.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Текст</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={8}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm min-h-[120px]"
                      placeholder="SEO/описательный текст категории (отображается на странице категории)"
                      maxLength={5000}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {form.description.length}/5000 символов. Необязательно.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">SEO заголовок (title)</label>
                    <input
                      type="text"
                      value={form.seo_title}
                      onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="Например: Купить букеты на День влюбленных"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Если заполнено — используется в &lt;title&gt; страницы категории вместо автогенерации.
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      />
                      <span className="text-sm text-[#111]">Активна</span>
                    </label>
                  </div>
                  {/* Блок "Цветы в составе" (справочник flowers) — только для категории "Цветы в составе" */}
                  {editing?.slug === FLOWERS_IN_COMPOSITION_CATEGORY_SLUG && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-[#111]">Цветы в составе (из товаров)</h4>
                        <button
                          type="button"
                          onClick={handleSyncFlowers}
                          disabled={flowersSyncLoading}
                          className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                        >
                          {flowersSyncLoading ? "Синхронизация…" : "Синхронизировать из товаров"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        Список можно обновить из товаров. Редактируйте название, SEO и порядок для каждого цветка.
                      </p>
                      {flowersLoading ? (
                        <p className="text-xs text-gray-500">Загрузка…</p>
                      ) : flowersList.length === 0 ? (
                        <p className="text-xs text-gray-500">Нет цветов. Нажмите «Синхронизировать из товаров».</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {flowersList.map((flower, idx) => (
                            <div
                              key={flower.id}
                              className={`flex items-center justify-between p-2 border rounded text-sm ${flower.is_active ? "border-gray-200" : "border-gray-100 bg-gray-50"}`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFlower(flower.id, "up")}
                                    disabled={idx === 0}
                                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Вверх"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFlower(flower.id, "down")}
                                    disabled={idx === flowersList.length - 1}
                                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Вниз"
                                  >
                                    ↓
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate ${flower.is_active ? "text-[#111]" : "text-gray-500"}`}>{flower.name}</p>
                                  {flower.seo_title && (
                                    <p className="text-xs text-gray-500 truncate">{flower.seo_title}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFlower(flower);
                                    setFlowerForm({
                                      name: flower.name,
                                      title: flower.title || "",
                                      description: flower.description || "",
                                      seo_title: flower.seo_title || "",
                                      seo_description: flower.seo_description || "",
                                      is_active: flower.is_active,
                                    });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Редактировать
                                </button>
                                {flower.is_active && (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteFlowerConfirmId(flower.id)}
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    Отключить
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDeleteFlowerHardConfirmId(flower.id)}
                                  className="text-xs text-red-700 hover:text-red-900 font-medium"
                                  title="Удалить из справочника навсегда"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Блок подкатегорий (только для категорий кроме "Цветы в составе", например "По поводу") */}
                  {editing && editing.slug !== FLOWERS_IN_COMPOSITION_CATEGORY_SLUG && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-[#111]">Подкатегории</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setCreatingSubcategory(true);
                            setEditingSubcategory(null);
                            setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          + Добавить подкатегорию
                        </button>
                      </div>
                      {subcategoriesLoading ? (
                        <p className="text-xs text-gray-500">Загрузка подкатегорий...</p>
                      ) : subcategories.length === 0 ? (
                        <p className="text-xs text-gray-500">Нет подкатегорий</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {subcategories.map((subcat, idx) => (
                            <div
                              key={subcat.id}
                              className="flex items-center justify-between p-2 border border-gray-200 rounded text-sm"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveSubcategory(subcat.id, "up")}
                                    disabled={idx === 0}
                                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Вверх"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveSubcategory(subcat.id, "down")}
                                    disabled={idx === subcategories.length - 1}
                                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Вниз"
                                  >
                                    ↓
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-[#111] truncate">{subcat.name}</p>
                                  {subcat.title && (
                                    <p className="text-xs text-gray-500 truncate">{subcat.title}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSubcategory(subcat);
                                    setCreatingSubcategory(false);
                                    setSubcategoryForm({
                                      name: subcat.name,
                                      title: subcat.title || "",
                                      description: subcat.description || "",
                                      seo_title: subcat.seo_title || "",
                                      seo_description: subcat.seo_description || "",
                                    });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Редактировать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteSubcategoryConfirmId(subcat.id)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 p-4 sm:p-6 pt-4 border-t border-border-block flex-shrink-0 bg-white">
                <button
                  type="submit"
                  className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
                >
                  Отмена
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmId(editing.id);
                      setEditing(null);
                      setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
                      setIsSlugManuallyEdited(false);
                    }}
                    className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка создания/редактирования подкатегории */}
      {(creatingSubcategory || editingSubcategory) && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => {
            setCreatingSubcategory(false);
            setEditingSubcategory(null);
            setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
          }} aria-hidden />
          <div
            className="relative w-[calc(100vw-32px)] max-w-[1000px] max-h-[calc(100vh-80px)] flex flex-col overflow-hidden rounded-xl border border-border-block bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-[2] flex items-center justify-between py-3 px-4 sm:px-6 border-b border-border-block flex-shrink-0 bg-white">
              <h3 className="text-lg font-semibold text-[#111] truncate pr-2">
                {creatingSubcategory ? "Новая подкатегория" : "Редактирование подкатегории"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCreatingSubcategory(false);
                  setEditingSubcategory(null);
                  setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
                }}
                className="p-1.5 rounded-full text-gray-500 hover:text-[#111] hover:bg-gray-100 flex-shrink-0"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveSubcategory} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6" style={{ overscrollBehavior: "contain" }}>
                {error && (creatingSubcategory || editingSubcategory) && (
                  <p className="mb-3 text-sm text-red-600">{error}</p>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название *</label>
                    <input
                      type="text"
                      value={subcategoryForm.name}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Заголовок</label>
                    <input
                      type="text"
                      value={subcategoryForm.title}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, title: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="Заполняется вручную"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ручное поле, не автозаполняется</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Описание</label>
                    <textarea
                      value={subcategoryForm.description}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                      rows={6}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm min-h-[120px]"
                      placeholder="Заполняется вручную"
                      maxLength={5000}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {subcategoryForm.description.length}/5000 символов. Ручное поле, не автозаполняется
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">SEO заголовок (title)</label>
                    <input
                      type="text"
                      value={subcategoryForm.seo_title}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, seo_title: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="SEO заголовок"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">SEO описание</label>
                    <textarea
                      value={subcategoryForm.seo_description}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, seo_description: e.target.value })}
                      rows={3}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
                      placeholder="SEO описание"
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-gray-500">{subcategoryForm.seo_description.length}/500 символов</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-4 sm:p-6 pt-4 border-t border-border-block flex-shrink-0 bg-white">
                <button
                  type="submit"
                  className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingSubcategory(false);
                    setEditingSubcategory(null);
                    setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
                  }}
                  className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
                >
                  Отмена
                </button>
                {editingSubcategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteSubcategoryConfirmId(editingSubcategory.id);
                      setEditingSubcategory(null);
                      setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
                    }}
                    className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка подтверждения удаления подкатегории */}
      {deleteSubcategoryConfirmId && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteSubcategoryConfirmId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Точно удалить подкатегорию?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteSubcategoryConfirmId(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-200"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSubcategory(deleteSubcategoryConfirmId)}
                className="rounded px-3 py-1.5 text-sm text-[#111] hover:bg-gray-50"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка редактирования цветка (справочник "Цветы в составе") */}
      {editingFlower && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setEditingFlower(null);
              setFlowerForm({ name: "", title: "", description: "", seo_title: "", seo_description: "", is_active: true });
            }}
            aria-hidden
          />
          <div
            className="relative w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveFlower} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <h3 className="mb-4 font-medium text-[#111]">Редактирование цветка</h3>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название *</label>
                    <input
                      type="text"
                      value={flowerForm.name}
                      onChange={(e) => setFlowerForm((f) => ({ ...f, name: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Заголовок</label>
                    <input
                      type="text"
                      value={flowerForm.title}
                      onChange={(e) => setFlowerForm((f) => ({ ...f, title: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="Опционально"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Описание</label>
                    <textarea
                      value={flowerForm.description}
                      onChange={(e) => setFlowerForm((f) => ({ ...f, description: e.target.value }))}
                      rows={4}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
                      placeholder="Опционально"
                      maxLength={5000}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">SEO заголовок</label>
                    <input
                      type="text"
                      value={flowerForm.seo_title}
                      onChange={(e) => setFlowerForm((f) => ({ ...f, seo_title: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="SEO title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">SEO описание</label>
                    <textarea
                      value={flowerForm.seo_description}
                      onChange={(e) => setFlowerForm((f) => ({ ...f, seo_description: e.target.value }))}
                      rows={2}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
                      placeholder="SEO description"
                      maxLength={500}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={flowerForm.is_active}
                        onChange={(e) => setFlowerForm((f) => ({ ...f, is_active: e.target.checked }))}
                      />
                      <span className="text-sm text-[#111]">Активен</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFlower(null);
                    setFlowerForm({ name: "", title: "", description: "", seo_title: "", seo_description: "", is_active: true });
                  }}
                  className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Подтверждение отключения цветка */}
      {deleteFlowerConfirmId && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteFlowerConfirmId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Отключить цветок? Он не будет отображаться в фильтрах и на витрине.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteFlowerConfirmId(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-200"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={() => handleDeactivateFlower(deleteFlowerConfirmId)}
                className="rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Отключить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Подтверждение удаления цветка из справочника */}
      {deleteFlowerHardConfirmId && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteFlowerHardConfirmId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[340px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">
              Удалить цветок из справочника навсегда? Связи с товарами также будут удалены. Восстановить нельзя.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteFlowerHardConfirmId(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFlowerHard(deleteFlowerHardConfirmId)}
                className="rounded px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {categoriesDraft.length > 0 && (
        <CategoriesGrid
          categories={categoriesDraft}
          onReorder={handleReorder}
          onEdit={(cat) => {
            setEditing(cat);
            setCreating(false);
            setForm({
              name: cat.name,
              slug: cat.slug ?? slugify(cat.name),
              is_active: cat.is_active,
              description: cat.description ?? "",
              seo_title: cat.seo_title ?? "",
            });
            setIsSlugManuallyEdited(false);
          }}
          onToggleActive={handleToggleActive}
          onDeleteClick={(cat) => setDeleteConfirmId(cat.id)}
          togglingId={togglingId}
        />
      )}

      {/* Мини-модалка подтверждения удаления */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Точно удалить?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-200"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded px-3 py-1.5 text-sm text-[#111] hover:bg-gray-50"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}

      {categoriesDraft.length === 0 && !creating && (
        <p className="py-8 text-center text-gray-500">Нет категорий. Нажмите «Добавить».</p>
      )}

      {isDirty && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={saveStatus === "saving"}
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text transition"
          >
            {saveStatus === "saving" ? "Сохранение…" : saveStatus === "saved" ? "Сохранено ✓" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={() => setCategoriesDraft([...categoriesFromServer])}
            className="rounded border border-outline-btn-border bg-white px-4 py-2 text-color-text-main hover:bg-outline-btn-hover-bg active:bg-outline-btn-active-bg transition"
          >
            Не сохранять
          </button>
        </div>
      )}
    </div>
  );
}
