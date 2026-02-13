"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Subcategory } from "@/types/admin";
import { parseAdminResponse } from "@/lib/adminFetch";

export default function AdminSubcategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  const [category, setCategory] = useState<{ id: string; name: string } | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", description: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadCategory = useCallback(async () => {
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
      const cat = data.find((c: { id: string }) => c.id === categoryId);
      if (!cat) {
        setError("Категория не найдена");
        return;
      }
      setCategory({ id: cat.id, name: cat.name });
    } catch (e) {
      setError(String(e));
    }
  }, [categoryId]);

  const loadSubcategories = useCallback(async () => {
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
  }, [categoryId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCategory(), loadSubcategories()]).finally(() => setLoading(false));
  }, [loadCategory, loadSubcategories]);

  function closeModal() {
    setCreating(false);
    setEditing(null);
    setForm({ name: "", title: "", description: "" });
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
    try {
      if (creating) {
        const url = "/api/admin/subcategories";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: categoryId,
            name: nameTrimmed,
            title: form.title.trim() || null,
            description: form.description.trim() || null,
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
        setForm({ name: "", title: "", description: "" });
      } else if (editing) {
        const url = `/api/admin/subcategories/${editing.id}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameTrimmed,
            title: form.title.trim() || null,
            description: form.description.trim() || null,
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
        setForm({ name: "", title: "", description: "" });
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

  if (error && !category) {
    return (
      <div className="space-y-6">
        <Link href="/admin/categories" className="text-gray-500 hover:text-gray-700">
          ← Категории
        </Link>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#111]">Подкатегории</h2>
          {category && <p className="text-sm text-gray-500 mt-1">Категория: {category.name}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({ name: "", title: "", description: "" });
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
                <h3 className="mb-4 font-medium text-[#111]">{creating ? "Новая подкатегория" : "Редактирование"}</h3>
                {error && (creating || editing) && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Заголовок (SEO)</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="Заполняется вручную"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ручное поле, не автозаполняется</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Описание (SEO)</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={6}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm min-h-[120px]"
                      placeholder="Заполняется вручную"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ручное поле, не автозаполняется</p>
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
                      setForm({ name: "", title: "", description: "" });
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
                <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Заголовок</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#111]">Описание</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[#111]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subcategories.map((subcategory) => (
                <tr key={subcategory.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-[#111]">{subcategory.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{subcategory.title || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {subcategory.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(subcategory);
                        setCreating(false);
                        setForm({
                          name: subcategory.name,
                          title: subcategory.title || "",
                          description: subcategory.description || "",
                        });
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
        <p className="py-8 text-center text-gray-500">Нет подкатегорий. Нажмите «Добавить».</p>
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
