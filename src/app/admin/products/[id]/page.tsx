"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/utils/slugify";

type ProductVariant = {
  id: number;
  product_id: number;
  size: string;
  composition?: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
  image_url?: string | null;
  description?: string | null;
};

type ProductData = {
  id: string;
  type?: "simple" | "variant";
  name: string;
  slug: string;
  description?: string | null;
  price?: number;
  min_price_cache?: number;
  image_url?: string | null;
  is_active: boolean;
  is_hidden: boolean;
  sort_order: number;
  category_slug?: string | null;
  variants?: ProductVariant[];
};

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
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
  const [variantForm, setVariantForm] = useState({
    size: "",
    composition: "",
    price: 0,
    is_active: true,
    sort_order: 0,
    image_url: "",
    description: "",
  });
  const [addingVariant, setAddingVariant] = useState(false);

  const isVariant = product?.type === "variant" || id?.startsWith("vp-");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Товар не найден");
        throw new Error("Ошибка загрузки");
      }
      const data = await res.json();
      setProduct(data);
      setForm({
        name: data.name ?? "",
        slug: data.slug ?? "",
        description: data.description ?? "",
        price: Number(data.price ?? data.min_price_cache ?? 0),
        image_url: data.image_url ?? "",
        is_active: data.is_active ?? true,
        is_hidden: data.is_hidden ?? false,
        sort_order: data.sort_order ?? 0,
        category_slug: data.category_slug ?? "",
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || null,
        image_url: form.image_url || null,
        is_active: form.is_active,
        is_hidden: form.is_hidden,
        sort_order: form.sort_order,
        category_slug: form.category_slug || null,
      };
      if (!isVariant) (payload as Record<string, unknown>).price = form.price;

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setProduct((p) => (p ? { ...p, ...payload, ...data } : p));
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: variantForm.size,
          composition: variantForm.composition || null,
          price: variantForm.price,
          is_active: variantForm.is_active,
          sort_order: variantForm.sort_order,
          image_url: variantForm.image_url || null,
          description: variantForm.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setProduct((p) =>
        p?.variants ? { ...p, variants: [...p.variants, data] } : p
      );
      setAddingVariant(false);
      setVariantForm({
        size: "",
        composition: "",
        price: 0,
        is_active: true,
        sort_order: (product?.variants?.length ?? 0),
        image_url: "",
        description: "",
      });
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeleteVariant(variantId: number) {
    if (!confirm("Удалить вариант?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}/variants/${variantId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ошибка");
      setProduct((p) =>
        p?.variants ? { ...p, variants: p.variants.filter((v) => v.id !== variantId) } : p
      );
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeleteProduct() {
    if (!confirm("Удалить товар? Это действие нельзя отменить.")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      router.push("/admin/products");
    } catch (e) {
      setError(String(e));
    }
  }

  if (loading) return <p className="text-[#111]">Загрузка…</p>;
  if (!product) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="text-gray-500 hover:text-slate-700">
            ← Товары
          </Link>
          <h2 className="text-xl font-semibold text-[#111]">{product.name}</h2>
        </div>
        <button
          type="button"
          onClick={handleDeleteProduct}
          className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          Удалить товар
        </button>
      </div>

        <form onSubmit={handleSaveProduct} className="rounded-xl border border-[#2E7D32] bg-white p-6 shadow-sm">
        <h3 className="font-medium text-[#111] mb-4">Основное</h3>
        <div className="grid gap-4 sm:grid-cols-2">
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
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-[#111]">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
              rows={3}
            />
          </div>
          {!isVariant && (
            <div>
              <label className="block text-sm text-[#111]">Цена (₽) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price || ""}
                onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                className="mt-1 w-32 rounded border px-3 py-2"
                required
              />
            </div>
          )}
          {isVariant && (
            <div>
              <label className="block text-sm text-[#111]">Мин. цена (из вариантов)</label>
              <p className="mt-1 text-[#111]">
                {Number(product.min_price_cache ?? 0).toLocaleString("ru-RU")} ₽
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm text-[#111]">URL изображения</label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-[#111]">Категория (slug)</label>
            <input
              type="text"
              value={form.category_slug}
              onChange={(e) => setForm((f) => ({ ...f, category_slug: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
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
        </div>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f] disabled:opacity-50"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </form>

      {isVariant && (
        <div className="rounded-xl border border-[#2E7D32] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[#111]">Варианты</h3>
            <button
              type="button"
              onClick={() => setAddingVariant(true)}
              className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f] text-sm"
            >
              Добавить вариант
            </button>
          </div>

          {addingVariant && (
            <form onSubmit={handleAddVariant} className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm text-[#111]">Размер/название *</label>
                  <input
                    type="text"
                    value={variantForm.size}
                    onChange={(e) => setVariantForm((f) => ({ ...f, size: e.target.value }))}
                    className="mt-1 w-full rounded border px-2 py-1"
                    required
                    placeholder="S, M, 25шт"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#111]">Цена (₽) *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={variantForm.price || ""}
                    onChange={(e) =>
                      setVariantForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))
                    }
                    className="mt-1 w-full rounded border px-2 py-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#111]">Состав</label>
                  <input
                    type="text"
                    value={variantForm.composition}
                    onChange={(e) => setVariantForm((f) => ({ ...f, composition: e.target.value }))}
                    className="mt-1 w-full rounded border px-2 py-1"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={variantForm.is_active}
                      onChange={(e) =>
                        setVariantForm((f) => ({ ...f, is_active: e.target.checked }))
                      }
                    />
                    <span className="text-sm">Активен</span>
                  </label>
                  <button type="submit" className="rounded bg-[#819570] px-3 py-1 text-white text-sm">
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingVariant(false)}
                    className="text-gray-500 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {product.variants?.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-[#2E7D32] bg-white p-3"
              >
                <div>
                  <span className="font-medium">{v.size}</span>
                  {v.composition && (
                    <span className="ml-2 text-sm text-gray-500">{v.composition}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span>{Number(v.price).toLocaleString("ru-RU")} ₽</span>
                  {!v.is_active && <span className="text-gray-400 text-sm">Неактивен</span>}
                  <button
                    type="button"
                    onClick={() => handleDeleteVariant(v.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {(!product.variants || product.variants.length === 0) && !addingVariant && (
              <p className="text-gray-500 py-4">Нет вариантов. Добавьте первый.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
