"use client";

import { useCallback, useEffect, useState } from "react";
import type { Subcategory } from "@/types/admin";
import { slugify } from "@/utils/slugify";
import { FLOWERS_IN_COMPOSITION_CATEGORY_SLUG } from "@/lib/constants";

export default function AdminFlowersInCompositionPage() {
  const [flowersCategoryId, setFlowersCategoryId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    title: "",
    description: "",
    seo_title: "",
    seo_description: "",
    is_active: true,
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Загружаем ID категории "Цветы в составе" по slug
  const loadFlowersCategory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Ошибка загрузки категорий");
      const data = await res.json();
      const flowersCategory = data.find((c: { slug: string }) => c.slug === FLOWERS_IN_COMPOSITION_CATEGORY_SLUG);
      if (!flowersCategory) {
        setError(
          'Категория "Цветы в составе" не найдена. Примените миграцию categories-add-flowers-in-composition.sql'
        );
        return;
      }
      setFlowersCategoryId(flowersCategory.id);
      return flowersCategory.id;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  // Загружаем подкатегории для категории "Цветы в составе"
  const loadSubcategories = useCallback(async (categoryId: string) => {
    try {
      const res = await fetch(`/api/admin/subcategories?category_id=${categoryId}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setSubcategories(data);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const categoryId = await loadFlowersCategory();
      if (categoryId) {
        await loadSubcategories(categoryId);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [loadFlowersCategory, loadSubcategories]);

  useEffect(() => {
    load();
  }, [load]);

  function closeModal() {
    setCreating(false);
    setEditing(null);
    setForm({
      name: "",
      slug: "",
      title: "",
      description: "",
      seo_title: "",
      seo_description: "",
      is_active: true,
    });
    setIsSlugManuallyEdited(false);
  }

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

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      setError("Название обязательно.");
      return;
    }
    if (!flowersCategoryId) {
      setError('Категория "Цветы в составе" не найдена');
      return;
    }
    try {
      if (creating) {
        const res = await fetch("/api/admin/subcategories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: flowersCategoryId,
            name: nameTrimmed,
            slug: form.slug.trim() || null,
            title: form.title.trim() || null,
            description: form.description.trim() || null,
            seo_title: form.seo_title.trim() || null,
            seo_description: form.seo_description.trim() || null,
            is_active: form.is_active,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        setSubcategories((s) => [...s, data].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
        setCreating(false);
        setForm({
          name: "",
          slug: "",
          title: "",
          description: "",
          seo_title: "",
          seo_description: "",
          is_active: true,
        });
        setIsSlugManuallyEdited(false);
      } else if (editing) {
        const res = await fetch(`/api/admin/subcategories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameTrimmed,
            slug: form.slug.trim() || null,
            title: form.title.trim() || null,
            description: form.description.trim() || null,
            seo_title: form.seo_title.trim() || null,
            seo_description: form.seo_description.trim() || null,
            is_active: form.is_active,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        setSubcategories((s) =>
          s.map((x) => (x.id === editing.id ? data : x)).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
        );
        setEditing(null);
        setForm({
          name: "",
          slug: "",
          title: "",
          description: "",
          seo_title: "",
          seo_description: "",
          is_active: true,
        });
        setIsSlugManuallyEdited(false);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`/api/admin/subcategories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      setSubcategories((s) => s.filter((x) => x.id !== id));
      setEditing(null);
    } catch (e) {
      setError(String(e));
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
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111]">Цветы в составе</h2>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({
              name: "",
              slug: "",
              title: "",
              description: "",
              seo_title: "",
              seo_description: "",
              is_active: true,
            });
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
            className="relative w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white hover:border-border-block-hover shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveForm} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <h3 className="mb-4 font-medium text-[#111]">{creating ? "Новый цветок" : "Редактирование"}</h3>
                {error && (creating || editing) && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название *</label>
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
                      placeholder="rozy"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Автоматически из названия. Если измените вручную — дальнейшее изменение названия не перезапишет
                      slug.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Заголовок (SEO)</label>
                    <input
                      type="text"
                      value={form.seo_title}
                      onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="Розы в Сочи — купить с доставкой"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Если заполнено — используется в &lt;title&gt; вместо шаблона.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Описание (SEO)</label>
                    <textarea
                      value={form.seo_description}
                      onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                      rows={4}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm min-h-[100px]"
                      placeholder="Шаблонный текст про букеты с этим цветком + доставка по Сочи"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Если заполнено — используется в meta description вместо шаблона.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Заголовок (старое поле)</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="Заполняется вручную"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ручное поле, не автозаполняется</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Описание (старое поле)</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={6}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm min-h-[120px]"
                      placeholder="Заполняется вручную"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ручное поле, не автозаполняется</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
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
                      setForm({
                        name: "",
                        slug: "",
                        title: "",
                        description: "",
                        seo_title: "",
                        seo_description: "",
                        is_active: true,
                      });
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

      {subcategories.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Название</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">SEO заголовок</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">SEO описание</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Активен</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[#111]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subcategories.map((subcategory) => (
                <tr key={subcategory.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-[#111]">{subcategory.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{subcategory.slug || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{subcategory.seo_title || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {subcategory.seo_description || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{subcategory.is_active ? "Да" : "Нет"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(subcategory);
                        setCreating(false);
                        setForm({
                          name: subcategory.name,
                          slug: subcategory.slug || "",
                          title: subcategory.title || "",
                          description: subcategory.description || "",
                          seo_title: subcategory.seo_title || "",
                          seo_description: subcategory.seo_description || "",
                          is_active: subcategory.is_active ?? true,
                        });
                        setIsSlugManuallyEdited(!!subcategory.slug);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-gray-500">Нет записей. Нажмите «Добавить».</p>
      )}

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
    </div>
  );
}
