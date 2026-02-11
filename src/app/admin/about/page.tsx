"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { BlogRichEditor } from "@/components/admin/BlogRichEditor";
import { parseAdminResponse } from "@/lib/adminFetch";

type AboutPage = {
  id: number;
  title: string | null;
  content: string;
  cover_image_path: string | null;
  cover_image_url: string | null;
  cover_alt: string | null;
  cover_caption: string | null;
  updated_at: string;
};

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title: null as string | null,
    content: "",
    cover_image_url: null as string | null,
    cover_image_path: null as string | null,
    cover_alt: null as string | null,
    cover_caption: null as string | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = "/api/admin/about-page";
      const res = await fetch(url);
      const result = await parseAdminResponse<{ page: AboutPage } & { error?: string }>(res, {
        method: "GET",
        url,
      });
      if (!result.ok || !result.data?.page) {
        const apiError = result.data && typeof (result.data as any).error === "string"
          ? (result.data as any).error
          : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки";
        throw new Error(message);
      }
      const data = result.data;
      const page = data.page;
      setForm({
        title: page.title ?? null,
        content: page.content ?? "",
        cover_image_url: page.cover_image_url ?? null,
        cover_image_path: page.cover_image_path ?? null,
        cover_alt: page.cover_alt ?? null,
        cover_caption: page.cover_caption ?? null,
      });
      // Загружаем размеры изображения если есть обложка
      if (page.cover_image_url) {
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = page.cover_image_url;
      }
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

    // Валидация размера файла на клиенте (25MB максимум)
    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Файл слишком большой. Максимум ${MAX_SIZE_BYTES / 1024 / 1024}MB`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Валидация типа файла
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Допустимые форматы: JPEG, PNG, WebP, AVIF, GIF");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploadingImage(true);
    setError("");
    setImageDimensions(null);

    // Получаем размеры изображения
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/about-page/upload", {
        method: "POST",
        body: formData,
      });

      const result = await parseAdminResponse<{ image_url?: string; path?: string; error?: string }>(res, {
        method: "POST",
        url: "/api/admin/about-page/upload",
      });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки изображения";
        throw new Error(message);
      }

      const data = result.data ?? {};
      setForm((prev) => ({
        ...prev,
        cover_image_url: data.image_url,
        cover_image_path: data.path,
      }));
    } catch (e) {
      setError(String(e));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const contentTrimmed = form.content.trim();

      // Для HTML контента проверяем наличие тегов или текста
      const hasContent = contentTrimmed.length > 0 && contentTrimmed.replace(/<[^>]*>/g, "").trim().length > 0;
      if (!hasContent) {
        throw new Error("Контент обязателен");
      }

      const res = await fetch("/api/admin/about-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title?.trim() || null,
          content: contentTrimmed,
          cover_image_url: form.cover_image_url,
          cover_image_path: form.cover_image_path,
          cover_alt: form.cover_alt?.trim() || null,
          cover_caption: form.cover_caption?.trim() || null,
        }),
      });

      const result = await parseAdminResponse<{ error?: string }>(res, {
        method: "PUT",
        url: "/api/admin/about-page",
      });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка сохранения";
        throw new Error(message);
      }

      setSaved(true);
      setError("");

      // Прокрутка вверх
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Скрыть сообщение через 3 секунды
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
        <h1 className="text-2xl font-bold">Редактировать страницу "О нас"</h1>
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Редактировать страницу "О нас"</h1>
      </div>

      {saved && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">✓ Сохранено</div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Заголовок (опционально) */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок (опционально)
          </label>
          <input
            id="title"
            type="text"
            value={form.title || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value || null }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent"
            placeholder="О нас"
          />
        </div>

        {/* Обложка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Обложка (шапка страницы)</label>
          {form.cover_image_url ? (
            <div className="space-y-2">
              <div className="relative w-full max-w-md aspect-[16/7] rounded-lg overflow-hidden bg-gray-100">
                <NextImage
                  src={form.cover_image_url}
                  alt={form.cover_alt || "Обложка"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 512px"
                />
              </div>
              {imageDimensions && (
                <div className="text-sm text-gray-600">
                  <span>
                    Фактический размер: {imageDimensions.width}×{imageDimensions.height} px
                  </span>
                  {(imageDimensions.width < 1200 || imageDimensions.height < 525) && (
                    <span className="ml-2 text-amber-600">⚠ Картинка маловата, лучше 1600×700+</span>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      cover_image_url: null,
                      cover_image_path: null,
                      cover_alt: null,
                      cover_caption: null,
                    }));
                    setImageDimensions(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-800 hover:underline"
                >
                  Удалить обложку
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/avif,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                id="cover-image"
                disabled={uploadingImage}
              />
              <label
                htmlFor="cover-image"
                className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploadingImage ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  "Загрузить обложку"
                )}
              </label>
              <p className="text-xs text-gray-500">
                Рекомендуемый размер: 1600×700 px (16:7, как у статей блога). Форматы: JPG/PNG/WebP до 25MB.
              </p>
            </div>
          )}
        </div>

        {/* Alt-текст изображения */}
        {form.cover_image_url && (
          <div>
            <label htmlFor="cover_alt" className="block text-sm font-medium text-gray-700 mb-2">
              Alt-текст изображения
            </label>
            <input
              id="cover_alt"
              type="text"
              value={form.cover_alt || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, cover_alt: e.target.value || null }))}
              placeholder="Описание изображения для доступности"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Краткое описание изображения для улучшения доступности и SEO.</p>
          </div>
        )}

        {/* Подпись к изображению */}
        {form.cover_image_url && (
          <div>
            <label htmlFor="cover_caption" className="block text-sm font-medium text-gray-700 mb-2">
              Подпись к изображению
            </label>
            <input
              id="cover_caption"
              type="text"
              value={form.cover_caption || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, cover_caption: e.target.value || null }))}
              placeholder="Подпись под изображением"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Текст, который будет отображаться под изображением.</p>
          </div>
        )}

        {/* Текст */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Контент страницы *
          </label>
          <BlogRichEditor value={form.content} onChange={(html) => setForm((prev) => ({ ...prev, content: html }))} />
          <p className="mt-1 text-xs text-gray-500">
            Используйте инструменты форматирования для оформления текста (подзаголовки, жирный/курсив, списки).
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-color-bg-main text-white rounded-lg hover:bg-color-accent-btn-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <Link href="/about" target="_blank" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Посмотреть на сайте
          </Link>
        </div>
      </form>
    </div>
  );
}
