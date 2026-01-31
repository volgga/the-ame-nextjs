"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  type: "simple" | "variant";
  name: string;
  slug: string;
  price: number;
  image_url?: string | null;
  is_active: boolean;
  is_hidden: boolean;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
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
  }

  useEffect(() => {
    load();
  }, [search]);

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
          <Link
            href="/admin/products/new"
            className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f]"
          >
            Добавить товар
          </Link>
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
                  ) : p.is_active ? (
                    <span className="text-[#2E7D32]">Активен</span>
                  ) : (
                    <span className="text-amber-600">Неактивен</span>
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
          <p className="text-gray-500 py-8 text-center">Нет товаров. Нажмите «Добавить товар».</p>
        )}
      </div>
    </div>
  );
}
