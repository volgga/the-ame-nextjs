"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { parseAdminResponse } from "@/lib/adminFetch";
import { AdminSortableImages, type SortableImageItem } from "@/components/admin/AdminSortableImages";

type CorporateSettings = {
  id: number;
  title: string | null;
  text: string | null;
  images: string[];
  max_link: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/avif,image/gif";

export default function AdminCorporatePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<CorporateSettings>({
    id: 1,
    title: null,
    text: null,
    images: [],
    max_link: null,
    seo_title: null,
    seo_description: null,
    updated_at: "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/corporate-page");
      const result = await parseAdminResponse<{ settings: CorporateSettings }>(res, {
        method: "GET",
        url: "/api/admin/corporate-page",
      });
      if (!result.ok || !result.data?.settings) {
        const apiError =
          result.data && typeof (result.data as { error?: string }).error === "string"
            ? (result.data as { error?: string }).error
            : null;
        throw new Error(apiError ?? result.message ?? "Ошибка загрузки");
      }
      const s = result.data.settings;
      setForm({
        id: s.id,
        title: s.title ?? null,
        text: s.text ?? null,
        images: Array.isArray(s.images) ? [...s.images] : [],
        max_link: s.max_link ?? null,
        seo_title: s.seo_title ?? null,
        seo_description: s.seo_description ?? null,
        updated_at: s.updated_at ?? "",
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`Файл слишком большой. Максимум ${MAX_SIZE / 1024 / 1024}MB`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/corporate-page/upload", { method: "POST", body: formData });
      const result = await parseAdminResponse<{ image_url?: string }>(res, {
        method: "POST",
        url: "/api/admin/corporate-page/upload",
      });
      if (!result.ok) {
        const err = result.data && typeof (result.data as { error?: string }).error === "string"
          ? (result.data as { error?: string }).error
          : result.message ?? "Ошибка загрузки";
        throw new Error(err);
      }
      const url = (result.data as { image_url?: string })?.image_url;
      if (url) {
        setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  const galleryItems: SortableImageItem[] = form.images.map((url, i) => ({
    id: `gallery-${i}-${url.slice(-20)}`,
    url,
  }));

  function handleGalleryReorder(newItems: SortableImageItem[]) {
    setForm((prev) => ({ ...prev, images: newItems.map((it) => it.url) }));
  }

  function handleGalleryRemove(id: string) {
    const idx = galleryItems.findIndex((it) => it.id === id);
    if (idx === -1) return;
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/corporate-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title?.trim() || null,
          text: form.text?.trim() || null,
          images: form.images,
          max_link: form.max_link?.trim() || null,
          seo_title: form.seo_title?.trim() || null,
          seo_description: form.seo_description?.trim() || null,
        }),
      });
      const result = await parseAdminResponse<{ settings?: CorporateSettings; error?: string }>(res, {
        method: "PUT",
        url: "/api/admin/corporate-page",
      });
      if (!result.ok) {
        const err = result.data && typeof (result.data as { error?: string }).error === "string"
          ? (result.data as { error?: string }).error
          : result.message ?? "Ошибка сохранения";
        throw new Error(err);
      }
      if (result.data?.settings) {
        setForm((prev) => ({ ...prev, ...result.data!.settings!, updated_at: result.data!.settings!.updated_at }));
      }
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Корпоративы</h1>
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Корпоративы</h1>
        <Link
          href="/corporate"
          target="_blank"
          className="text-sm text-color-text-main hover:underline"
        >
          Открыть страницу на сайте →
        </Link>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">✓ Сохранено</div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок
          </label>
          <input
            id="title"
            type="text"
            value={form.title ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value || null }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent"
            placeholder="Оформление мероприятий"
          />
        </div>

        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Основной текст
          </label>
          <textarea
            id="text"
            rows={5}
            value={form.text ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value || null }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent"
            placeholder="Описание услуг по оформлению мероприятий..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Фото галереи</label>
          <p className="text-xs text-gray-500 mb-2">
            Перетаскивайте фото для изменения порядка. Удаление — крестик на превью.
          </p>
          {galleryItems.length > 0 && (
            <div className="mb-3">
              <AdminSortableImages
                items={galleryItems}
                onReorder={handleGalleryReorder}
                onRemove={handleGalleryRemove}
                thumbSize={88}
              />
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleImageUpload}
              className="hidden"
              id="corporate-gallery-file"
              disabled={uploading}
            />
            <label
              htmlFor="corporate-gallery-file"
              className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Загрузка...
                </>
              ) : (
                "Добавить фото"
              )}
            </label>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">SEO</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700 mb-2">
                SEO заголовок
              </label>
              <input
                id="seo_title"
                type="text"
                value={form.seo_title ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value || null }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent"
                placeholder="Оформление мероприятий от цветочной студии The Ame в Сочи"
              />
            </div>
            <div>
              <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700 mb-2">
                SEO описание
              </label>
              <textarea
                id="seo_description"
                rows={2}
                value={form.seo_description ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value || null }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent"
                placeholder="Команда The Ame с любовью оформит ваш фасад..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-color-bg-main text-white rounded-lg hover:bg-color-accent-btn-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <Link
            href="/corporate"
            target="_blank"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Посмотреть на сайте
          </Link>
        </div>
      </form>
    </div>
  );
}
