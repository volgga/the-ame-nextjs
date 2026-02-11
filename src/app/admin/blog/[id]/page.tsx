"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import { slugify } from "@/utils/slugify";
import { BlogRichEditor } from "@/components/admin/BlogRichEditor";
import { parseAdminResponse } from "@/lib/adminFetch";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
  cover_alt: string | null;
  cover_caption: string | null;
  published: boolean;
};

export default function AdminBlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: null as string | null,
    cover_image_url: null as string | null,
    cover_image_path: null as string | null,
    cover_alt: null as string | null,
    cover_caption: null as string | null,
    published: false,
  });
  const [excerptLength, setExcerptLength] = useState(0);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const url = `/api/admin/blog/${id}`;
      const res = await fetch(url);
      const result = await parseAdminResponse<{ post: BlogPost } & { error?: string }>(res, {
        method: "GET",
        url,
      });
      if (!result.ok || !result.data?.post) {
        const apiError = result.data && typeof (result.data as any).error === "string"
          ? (result.data as any).error
          : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки";
        throw new Error(message);
      }
      const post = result.data.post;
      setForm({
        title: post.title ?? "",
        slug: post.slug ?? "",
        content: post.content ?? "",
        excerpt: post.excerpt ?? null,
        cover_image_url: post.cover_image_url ?? null,
        cover_image_path: post.cover_image_path ?? null,
        cover_alt: post.cover_alt ?? null,
        cover_caption: post.cover_caption ?? null,
        published: post.published ?? false,
      });
      setExcerptLength((post.excerpt ?? "").length);
      // Загружаем размеры изображения если есть обложка
      if (post.cover_image_url) {
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = post.cover_image_url;
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  // Автогенерация slug из title
  useEffect(() => {
    if (!isSlugManuallyEdited && form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(form.title) }));
    }
  }, [form.title, isSlugManuallyEdited]);

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
      if (!isNew) {
        formData.append("postId", id);
      }

      const res = await fetch("/api/admin/blog/upload", {
        method: "POST",
        body: formData,
      });

      const result = await parseAdminResponse<{ image_url?: string; path?: string; error?: string }>(res, {
        method: "POST",
        url: "/api/admin/blog/upload",
      });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки изображения";
        // Ошибка уже обработана на сервере с понятным сообщением
        throw new Error(message);
      }

      const data = result.data ?? {};
      setForm((prev) => ({
        ...prev,
        cover_image_url: data.image_url ?? null,
        cover_image_path: data.path ?? null,
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
      const titleTrimmed = form.title.trim();
      const slugTrimmed = form.slug.trim();
      const contentTrimmed = form.content.trim();

      if (!titleTrimmed) {
        throw new Error("Заголовок обязателен");
      }
      if (!slugTrimmed) {
        throw new Error("Slug обязателен");
      }
      // Для HTML контента проверяем наличие тегов или текста
      const hasContent = contentTrimmed.length > 0 && contentTrimmed.replace(/<[^>]*>/g, "").trim().length > 0;
      if (!hasContent) {
        throw new Error("Текст обязателен");
      }

      const url = isNew ? "/api/admin/blog" : `/api/admin/blog/${id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleTrimmed,
          slug: slugTrimmed,
          content: contentTrimmed,
          excerpt: form.excerpt?.trim() || null,
          cover_image_url: form.cover_image_url,
          cover_image_path: form.cover_image_path,
          cover_alt: form.cover_alt?.trim() || null,
          cover_caption: form.cover_caption?.trim() || null,
          published: form.published,
        }),
      });

      const result = await parseAdminResponse<{ post?: BlogPost; error?: string }>(res, {
        method,
        url,
      });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка сохранения";
        throw new Error(message);
      }

      const responseData = result.data ?? {};
      setSaved(true);
      setError("");

      // Если создали новый пост, обновляем URL на страницу редактирования
      if (isNew && responseData.post?.id) {
        router.replace(`/admin/blog/${responseData.post.id}`);
      }

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
        <h1 className="text-2xl font-bold">{isNew ? "Создать пост" : "Редактировать пост"}</h1>
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "Создать пост" : "Редактировать пост"}</h1>
        <Link href="/admin/blog" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
          ← Назад к списку
        </Link>
      </div>

      {saved && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">✓ Сохранено</div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Заголовок */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок *
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            Slug (URL) *
          </label>
          <input
            id="slug"
            type="text"
            value={form.slug}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, slug: e.target.value }));
              setIsSlugManuallyEdited(true);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Автоматически генерируется из заголовка. Можно редактировать вручную.
          </p>
        </div>

        {/* Excerpt (SEO описание) */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            Короткое описание (для SEO)
          </label>
          <textarea
            id="excerpt"
            value={form.excerpt || ""}
            onChange={(e) => {
              const value = e.target.value;
              setForm((prev) => ({ ...prev, excerpt: value || null }));
              setExcerptLength(value.length);
            }}
            rows={3}
            maxLength={200}
            placeholder="1–2 предложения. Используется как meta description. Если пусто — будет сгенерировано автоматически."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-bg-main focus:border-transparent resize-y"
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Используется как meta description. Если пусто — будет сгенерировано автоматически из текста статьи.
            </p>
            <span className={`text-xs ${excerptLength > 160 ? "text-amber-600" : "text-gray-500"}`}>
              {excerptLength}/200
            </span>
          </div>
        </div>

        {/* Обложка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Обложка</label>
          {form.cover_image_url ? (
            <div className="space-y-2">
              <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden bg-gray-100">
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
                  {(imageDimensions.width < 1200 || imageDimensions.height < 675) && (
                    <span className="ml-2 text-amber-600">⚠ Картинка маловата, лучше 1600×900+</span>
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
                Рекомендуемый размер: 1600×900 px (16:9). Форматы: JPG/PNG/WebP до 5MB.
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
            Текст статьи *
          </label>
          <BlogRichEditor
            value={form.content}
            onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
            postId={isNew ? undefined : id}
          />
          <p className="mt-1 text-xs text-gray-500">
            Используйте инструменты форматирования для оформления текста. Для вставки изображений сначала сохраните
            пост.
          </p>
        </div>

        {/* Опубликовано */}
        <div className="flex items-center gap-3">
          <input
            id="published"
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
            className="w-4 h-4 text-color-bg-main border-gray-300 rounded focus:ring-color-bg-main"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-700 cursor-pointer">
            Опубликовать пост (виден публично)
          </label>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-color-bg-main text-white rounded-lg hover:bg-color-accent-btn-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Сохранение..." : isNew ? "Создать" : "Сохранить"}
          </button>
          <Link href="/admin/blog" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
