"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/utils/slugify";

export default function AdminProductsNewPage() {
  const router = useRouter();
  const [type, setType] = useState<"simple" | "variant">("simple");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    image_url: "",
    is_active: true,
    is_hidden: false,
    sort_order: 0,
    category_slug: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const slug = form.slug.trim() || slugify(form.name);
    const payload =
      type === "simple"
        ? {
            type: "simple",
            name: form.name,
            slug: slug || undefined,
            description: form.description || undefined,
            price: form.price,
            image_url: form.image_url || undefined,
            is_active: form.is_active,
            is_hidden: form.is_hidden,
            sort_order: form.sort_order,
            category_slug: form.category_slug || null,
          }
        : {
            type: "variant",
            name: form.name,
            slug: slug || undefined,
            description: form.description || undefined,
            image_url: form.image_url || undefined,
            is_active: form.is_active,
            is_hidden: form.is_hidden,
            sort_order: form.sort_order,
            category_slug: form.category_slug || null,
          };

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка создания");
      const id = data.id ?? (type === "variant" ? `vp-${data.id}` : data.id);
      router.push(`/admin/products/${id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-gray-500 hover:text-[#111]">
          ← Товары
        </Link>
        <h2 className="text-xl font-semibold text-[#111]">Новый товар</h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-[#2E7D32] bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111] mb-2">Тип товара</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={type === "simple"}
                  onChange={() => setType("simple")}
                />
                Простой (одна цена)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={type === "variant"}
                  onChange={() => setType("variant")}
                />
                С вариантами (размеры/типы)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111]">Название *</label>
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
            <label className="block text-sm font-medium text-[#111]">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="avtorskiy-buket"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111]">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
              rows={3}
            />
          </div>

          {type === "simple" && (
            <div>
              <label className="block text-sm font-medium text-[#111]">Цена (₽) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price || ""}
                onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                className="mt-1 w-32 rounded border px-3 py-2"
                required={type === "simple"}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#111]">URL изображения</label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111]">Категория (slug)</label>
            <input
              type="text"
              value={form.category_slug}
              onChange={(e) => setForm((f) => ({ ...f, category_slug: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="avtorskie-bukety"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Активен
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_hidden}
                onChange={(e) => setForm((f) => ({ ...f, is_hidden: e.target.checked }))}
              />
              Скрыт
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

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f] disabled:opacity-50"
            >
              {loading ? "Создание…" : "Создать"}
            </button>
            <Link
              href="/admin/products"
              className="rounded border px-4 py-2 text-[#111] hover:bg-slate-50"
            >
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
