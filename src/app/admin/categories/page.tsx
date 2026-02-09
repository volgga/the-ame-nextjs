"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/components/admin/categories/CategoryCard";
import type { Subcategory } from "@/types/admin";
import { slugify } from "@/utils/slugify";

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

  const isDirty = !areOrdersEqual(categoriesFromServer, categoriesDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
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
    // Очищаем состояние подкатегорий
    setSubcategories([]);
    setEditingSubcategory(null);
    setCreatingSubcategory(false);
    setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
    setDeleteSubcategoryConfirmId(null);
  }

  // Загрузка подкатегорий при открытии модалки редактирования
  const loadSubcategories = useCallback(async (categoryId: string) => {
    setSubcategoriesLoading(true);
    try {
      const res = await fetch(`/api/admin/subcategories?category_id=${categoryId}`);
      if (!res.ok) throw new Error("Ошибка загрузки подкатегорий");
      const data = await res.json();
      setSubcategories(data);
    } catch (e) {
      console.error("[admin/categories] Error loading subcategories:", e);
    } finally {
      setSubcategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (editing?.id) {
      loadSubcategories(editing.id);
    } else {
      setSubcategories([]);
    }
  }, [editing?.id, loadSubcategories]);

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
        const res = await fetch("/api/admin/categories", {
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        const newCat = { ...data, sort_order: categoriesDraft.length };
        setCategoriesFromServer((s) => [...s, newCat].sort((a, b) => a.sort_order - b.sort_order));
        setCategoriesDraft((s) => [...s, newCat].sort((a, b) => a.sort_order - b.sort_order));
        setCreating(false);
        setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
        setIsSlugManuallyEdited(false);
      } else if (editing) {
        const res = await fetch(`/api/admin/categories/${editing.id}`, {
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
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
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      const updated = { ...cat, is_active: data.is_active };
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
        const reorderRes = await fetch("/api/admin/categories/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: withOrder.map((c, i) => ({ id: c.id, sort_order: i })),
          }),
        });
        if (!reorderRes.ok) {
          const err = await reorderRes.json();
          setError(err.error ?? "Порядок не обновлён");
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
        const res = await fetch("/api/admin/subcategories", {
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        setSubcategories((s) => [...s, data].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
        setCreatingSubcategory(false);
        setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
      } else if (editingSubcategory) {
        const res = await fetch(`/api/admin/subcategories/${editingSubcategory.id}`, {
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
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

    // Обновляем sort_order
    const updated = newSubcategories.map((s, i) => ({ ...s, sort_order: i }));
    setSubcategories(updated);

    // Сохраняем порядок на сервере
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ошибка сохранения");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} aria-hidden />
          <div
            className="relative w-full max-w-[480px] max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white hover:border-border-block-hover shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveForm} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <h3 className="mb-4 font-medium text-[#111]">{creating ? "Новая категория" : "Редактирование"}</h3>
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
                  {/* Блок управления подкатегориями (только при редактировании) */}
                  {editing && (
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
              <div className="flex gap-2 p-6 pt-4 border-t border-gray-100">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => {
            setCreatingSubcategory(false);
            setEditingSubcategory(null);
            setSubcategoryForm({ name: "", title: "", description: "", seo_title: "", seo_description: "" });
          }} aria-hidden />
          <div
            className="relative w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white hover:border-border-block-hover shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveSubcategory} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <h3 className="mb-4 font-medium text-[#111]">
                  {creatingSubcategory ? "Новая подкатегория" : "Редактирование подкатегории"}
                </h3>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
