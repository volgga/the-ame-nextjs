"use client";

import { useCallback, useEffect, useState } from "react";
import type { Subcategory } from "@/types/admin";
import { OCCASIONS_CATEGORY_SLUG } from "@/lib/constants";
import { slugify } from "@/utils/slugify";
import { parseAdminResponse } from "@/lib/adminFetch";

export default function AdminOccasionsPage() {
  const [occasionsCategoryId, setOccasionsCategoryId] = useState<string | null>(null);
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

  // Загружаем ID категории "По поводу" по slug
  const loadOccasionsCategory = useCallback(async () => {
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
          : result.message ?? "Ошибка загрузки категорий";
        throw new Error(message);
      }
      const data = result.data;
      const occasionsCategory = data.find((c: { slug: string }) => c.slug === OCCASIONS_CATEGORY_SLUG);
      if (!occasionsCategory) {
        setError('Категория "По поводу" не найдена. Примените миграцию categories-add-occasions-category.sql');
        return;
      }
      setOccasionsCategoryId(occasionsCategory.id);
      return occasionsCategory.id;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  // Загружаем подкатегории для категории "По поводу"
  const loadSubcategories = useCallback(async (categoryId: string) => {
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
          : result.message ?? "Ошибка загрузки";
        throw new Error(message);
      }
      setSubcategories(result.data);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const categoryId = await loadOccasionsCategory();
      if (categoryId) {
        await loadSubcategories(categoryId);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [loadOccasionsCategory, loadSubcategories]);

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

  const anyModalOpen = creating || !!editing || !!deleteConfirmId;
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

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      setError("Название обязательно.");
      return;
    }
    if (!occasionsCategoryId) {
      setError('Категория "По поводу" не найдена');
      return;
    }
    try {
      if (creating) {
        const url = "/api/admin/subcategories";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: occasionsCategoryId,
            name: nameTrimmed,
            slug: form.slug.trim() || null,
            title: form.title.trim() || null,
            description: form.description.trim() || null,
            seo_title: form.seo_title.trim() || null,
            seo_description: form.seo_description.trim() || null,
            is_active: form.is_active,
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
        const url = `/api/admin/subcategories/${editing.id}`;
        const res = await fetch(url, {
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
      const url = `/api/admin/subcategories/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      const result = await parseAdminResponse<{ error?: string }>(res, { method: "DELETE", url });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка удаления";
        throw new Error(message);
      }
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
        <h2 className="text-xl font-semibold text-[#111]">По поводу</h2>
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
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} aria-hidden />
          <div
            className="relative w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white hover:border-border-block-hover shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveForm} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <h3 className="mb-4 font-medium text-[#111]">{creating ? "Новое 'По поводу'" : "Редактирование"}</h3>
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
                      placeholder="8-marta"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Автоматически из названия. Если измените вручную — дальнейшее изменение названия не перезапишет
                      slug.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">SEO заголовок (title)</label>
                    <input
                      type="text"
                      value={form.seo_title}
                      onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="Купить цветы на 8 марта в Сочи с доставкой"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Если заполнено — используется в &lt;title&gt; вместо шаблона.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">SEO описание</label>
                    <textarea
                      value={form.seo_description}
                      onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                      rows={4}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm min-h-[100px]"
                      placeholder="Шаблонный текст про букеты по данному поводу + доставка"
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
    </div>
  );
}
