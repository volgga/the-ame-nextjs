"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import Image from "next/image";
import { parseAdminResponse } from "@/lib/adminFetch";

type OrderBlockData = {
  title: string;
  subtitle1: string;
  text: string;
  imageUrl: string | null;
};

const DEFAULT_DATA: OrderBlockData = {
  title: "Заказать букет вашей мечты",
  subtitle1: "",
  text: "Соберём букет вашей мечты и доставим по Сочи уже сегодня. Оставьте заявку на сайте или позвоните нам — мы подберём идеальное сочетание цветов под ваш повод и бюджет.",
  imageUrl: null,
};

const RECOMMENDED_SIZE = "800×800";
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/avif";

function snapshot(data: OrderBlockData): string {
  return JSON.stringify({
    title: data.title,
    subtitle1: data.subtitle1,
    text: data.text,
    imageUrl: data.imageUrl,
  });
}

export type OrderBlockFormRef = {
  save: () => Promise<void>;
  resetToInitial: () => void;
};

type OrderBlockFormProps = {
  onDirtyChange?: (dirty: boolean) => void;
  formRef?: React.RefObject<OrderBlockFormRef | null>;
};

/**
 * OrderBlockForm — форма редактирования контента блока «Форма с заказом» (заголовок, текст, изображение).
 */
export const OrderBlockForm = forwardRef<OrderBlockFormRef, OrderBlockFormProps>(function OrderBlockForm(
  { onDirtyChange, formRef: formRefProp },
  ref
) {
  const resolvedRef = formRefProp ?? ref;
  const [data, setData] = useState<OrderBlockData | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isDirty = data !== null && initialSnapshot !== "" && snapshot(data) !== initialSnapshot;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const performSave = useCallback(async (): Promise<void> => {
    if (!data) return;
    const payload = {
      title: (data.title || "").trim(),
      subtitle1: (data.subtitle1 || "").trim(),
      text: (data.text || "").trim(),
      imageUrl: data.imageUrl || null,
    };
    if (!payload.title || !payload.text) return;
    const res = await fetch("/api/admin/home-order-block", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await parseAdminResponse<OrderBlockData & { error?: string }>(res, {
      method: "PATCH",
      url: "/api/admin/home-order-block",
    });
    if (!result.ok || !result.isJson) {
      const errorMsg = result.data && typeof result.data === "object" && "error" in result.data
        ? (result.data as any).error
        : result.message ?? "Ошибка сохранения";
      throw new Error(errorMsg);
    }
    const responseData = result.data ?? DEFAULT_DATA;
    const updated = {
      title: responseData.title ?? data.title,
      subtitle1: responseData.subtitle1 ?? data.subtitle1,
      text: responseData.text ?? data.text,
      imageUrl: responseData.imageUrl ?? data.imageUrl,
    };
    setData(updated);
    setInitialSnapshot(snapshot(updated));
  }, [data]);

  useImperativeHandle(
    resolvedRef,
    () => ({
      save: async () => {
        setSaving(true);
        setError("");
        try {
          await performSave();
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } catch (e) {
          setError((e as Error).message || "Не удалось сохранить");
          throw e;
        } finally {
          setSaving(false);
        }
      },
      resetToInitial: () => {
        if (initialSnapshot === "") return;
        const parsed = JSON.parse(initialSnapshot) as OrderBlockData;
        setData(parsed);
        setPreviewUrl(parsed.imageUrl);
      },
    }),
    [initialSnapshot, performSave]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/home-order-block");
      const result = await parseAdminResponse<OrderBlockData & { _tableMissing?: boolean }>(res, {
        method: "GET",
        url: "/api/admin/home-order-block",
      });
      if (!result.ok || !result.isJson) {
        setData(DEFAULT_DATA);
        setInitialSnapshot(snapshot(DEFAULT_DATA));
        return;
      }
      const resData = result.data ?? DEFAULT_DATA;
      const next = {
        title: resData.title ?? DEFAULT_DATA.title,
        subtitle1: resData.subtitle1 ?? DEFAULT_DATA.subtitle1,
        text: resData.text ?? DEFAULT_DATA.text,
        imageUrl: resData.imageUrl ?? null,
      };
      setData(next);
      setInitialSnapshot(snapshot(next));
      if (resData.imageUrl) setPreviewUrl(resData.imageUrl);
      if (resData._tableMissing) {
        setError(
          "⚠️ Поля блока не найдены в таблице home_reviews. Выполните миграцию scripts/migrations/home-order-block.sql"
        );
      }
    } catch {
      setData(DEFAULT_DATA);
      setInitialSnapshot(snapshot(DEFAULT_DATA));
      setError("Не удалось загрузить данные. Используются значения по умолчанию.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (data?.imageUrl) setPreviewUrl(data.imageUrl);
    else setPreviewUrl(null);
  }, [data?.imageUrl]);

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/home-order-block/upload", { method: "POST", body: formData });
    const result = await parseAdminResponse<{ image_url?: string; error?: string }>(res, {
      method: "POST",
      url: "/api/admin/home-order-block/upload",
    });
    if (!result.ok || !result.isJson) {
      const errorMsg = result.data && typeof result.data === "object" && "error" in result.data
        ? (result.data as any).error
        : result.message ?? "Ошибка загрузки";
      throw new Error(errorMsg);
    }
    const responseData = result.data ?? {};
    return responseData.image_url;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    uploadFile(f)
      .then((url) => {
        setData((d) => (d ? { ...d, imageUrl: url } : null));
        setPreviewUrl(url);
      })
      .catch((err) => setError(`Ошибка загрузки изображения: ${err.message}`))
      .finally(() => {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await performSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message || "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  }

  function resetToInitial() {
    if (initialSnapshot === "") return;
    const parsed = JSON.parse(initialSnapshot) as OrderBlockData;
    setData(parsed);
    setPreviewUrl(parsed.imageUrl);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  const formData = data || DEFAULT_DATA;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form ref={formRef} onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#111] mb-1">Заголовок</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setData((d) => (d ? { ...d, title: e.target.value } : { ...DEFAULT_DATA, title: e.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111] mb-1">Подзаголовок №1</label>
          <textarea
            value={formData.subtitle1}
            onChange={(e) =>
              setData((d) => (d ? { ...d, subtitle1: e.target.value } : { ...DEFAULT_DATA, subtitle1: e.target.value }))
            }
            rows={4}
            className="w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
            placeholder="Серый текст сразу под заголовком"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111] mb-1">Основной текст</label>
          <textarea
            value={formData.text}
            onChange={(e) =>
              setData((d) => (d ? { ...d, text: e.target.value } : { ...DEFAULT_DATA, text: e.target.value }))
            }
            rows={10}
            className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111] mb-1">Фото</label>
          <p className="mt-0.5 text-xs text-gray-500">
            Рекомендуемый размер: {RECOMMENDED_SIZE}. JPEG, PNG, WebP, AVIF. До 15MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            disabled={uploading}
            className="mt-2 block w-full text-sm text-[#111] file:mr-4 file:rounded file:border-0 file:bg-accent-btn file:px-4 file:py-2 file:text-white file:hover:bg-accent-btn-hover disabled:opacity-50"
          />
          {previewUrl && (
            <div className="mt-2 relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <Image
                src={previewUrl}
                alt="Превью"
                fill
                className="object-cover"
                unoptimized={previewUrl.startsWith("blob:")}
                sizes="300px"
              />
            </div>
          )}
          {uploading && <p className="mt-2 text-sm text-gray-500">Загрузка...</p>}
          {formData.imageUrl && (
            <button
              type="button"
              onClick={() => {
                setData((d) => (d ? { ...d, imageUrl: null } : null));
                setPreviewUrl(null);
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              Удалить фото
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
          >
            {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={resetToInitial}
            disabled={!isDirty || saving}
            className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отменить изменения
          </button>
        </div>
      </form>
    </div>
  );
});
