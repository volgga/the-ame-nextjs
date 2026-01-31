"use client";

import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", sort_order: 0, is_active: true });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const slug = form.slug.trim() || slugify(form.name);
    const payload = { ...form, slug: slug || "category" };
    try {
      if (creating) {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        setCategories((c) => [...c, data].sort((a, b) => a.sort_order - b.sort_order));
        setCreating(false);
        setForm({ name: "", slug: "", sort_order: categories.length, is_active: true });
      } else if (editing) {
        const res = await fetch(`/api/admin/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        setCategories((c) => c.map((x) => (x.id === editing.id ? { ...x, ...payload } : x)));
        setEditing(null);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить категорию?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      setCategories((c) => c.filter((x) => x.id !== id));
    } catch (e) {
      setError(String(e));
    }
  }

  if (loading) return <p className="text-[#111]">Загрузка…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111]">Категории</h2>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({ name: "", slug: "", sort_order: categories.length, is_active: true });
          }}
          className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f]"
        >
          Добавить
        </button>
      </div>

      {(creating || editing) && (
        <form onSubmit={handleSave} className="rounded-xl border border-[#2E7D32] bg-white p-6 shadow-sm">
          <h3 className="font-medium text-[#111] mb-4">
            {creating ? "Новая категория" : "Редактирование"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-[#111]">Название *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.slug || slugify(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#111]">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="avtorskie-bukety"
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <span className="text-sm text-[#111]">Активна</span>
              </label>
              <div>
                <label className="block text-sm text-[#111]">Порядок</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                  className="mt-1 w-20 rounded border px-2 py-1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f]">
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-[#2E7D32] bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-medium text-[#111]">{c.name}</p>
              <p className="text-sm text-gray-500">{c.slug}</p>
            </div>
            <span className={`text-sm ${c.is_active ? "text-[#2E7D32]" : "text-gray-400"}`}>
              {c.is_active ? "Активна" : "Выкл"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(c);
                  setCreating(false);
                  setForm({
                    name: c.name,
                    slug: c.slug,
                    sort_order: c.sort_order,
                    is_active: c.is_active,
                  });
                }}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-[#111] hover:bg-gray-50"
              >
                Изменить
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && !creating && (
          <p className="text-gray-500 py-8 text-center">Нет категорий. Нажмите «Добавить».</p>
        )}
      </div>
    </div>
  );
}
