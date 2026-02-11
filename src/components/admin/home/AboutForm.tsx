"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import Image from "next/image";
import { parseAdminResponse } from "@/lib/adminFetch";

type AboutData = {
  title: string;
  text: string;
  imageUrl: string | null;
  /** Приходит с API когда таблица home_reviews отсутствует */
  _tableMissing?: boolean;
};

const DEFAULT_DATA: AboutData = {
  title: "О нас",
  text: `Цветочный магазин «THE AME»

Цветочный магазин «THE AME» предлагает доставку цветов в Сочи и удобный онлайн-заказ букетов для любого повода. У нас вы можете купить цветы в Сочи с быстрой доставкой — домой, в офис, отель или ресторан. Мы работаем только с свежими цветами и создаём букеты, которые радуют внешним видом и сохраняют свежесть как можно дольше.

В каталоге «THE AME» представлены букеты цветов на любой вкус: классические и авторские композиции, букеты из роз, монобукеты, цветы в коробке и цветы в корзине. Наши флористы внимательно подбирают каждый элемент композиции, учитывая стиль, повод и ваши пожелания. Мы следим за современными тенденциями флористики и регулярно обновляем ассортимент, чтобы вы могли заказать актуальные и стильные букеты.

Доставка цветов по Сочи осуществляется ежедневно и охватывает все основные районы города. Вы можете оформить заказ заранее или в день доставки, выбрать удобное время и добавить открытку с личным текстом. Мы бережно упаковываем каждый букет и контролируем качество на всех этапах — от сборки до передачи получателю.

Цветы с доставкой в Сочи от «THE AME» — это удобный способ поздравить близких, выразить чувства или сделать приятный сюрприз. Закажите букет онлайн и доверьте заботу о деталях профессиональной команде цветочного магазина «THE AME».`,
  imageUrl: null,
};

const RECOMMENDED_SIZE = "800×800";
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/avif";

function snapshot(data: AboutData): string {
  return JSON.stringify({ title: data.title, text: data.text, imageUrl: data.imageUrl });
}

export type AboutFormRef = {
  save: () => Promise<void>;
  resetToInitial: () => void;
};

type AboutFormProps = {
  onDirtyChange?: (dirty: boolean) => void;
  /** Передайте formRef, если форма загружается через next/dynamic (ref не пробрасывается) */
  formRef?: React.RefObject<AboutFormRef | null>;
};

/**
 * AboutForm — форма редактирования секции "О нас" для использования в модалке.
 */
export const AboutForm = forwardRef<AboutFormRef, AboutFormProps>(function AboutForm(
  { onDirtyChange, formRef: formRefProp },
  ref
) {
  const resolvedRef = formRefProp ?? ref;
  const [data, setData] = useState<AboutData | null>(null);
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
      text: (data.text || "").trim(),
      imageUrl: data.imageUrl || null,
    };
    if (!payload.title || !payload.text) return;
    const res = await fetch("/api/admin/home-about", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await parseAdminResponse<AboutData & { error?: string }>(res, {
      method: "PATCH",
      url: "/api/admin/home-about",
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
        const parsed = JSON.parse(initialSnapshot) as AboutData;
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
      const res = await fetch("/api/admin/home-about");
      const result = await parseAdminResponse<AboutData & { _tableMissing?: boolean }>(res, {
        method: "GET",
        url: "/api/admin/home-about",
      });
      if (!result.ok || !result.isJson) {
        console.error("[AdminAbout] Ошибка загрузки:", result.status, result.message);
        setData(DEFAULT_DATA);
        setInitialSnapshot(snapshot(DEFAULT_DATA));
        return;
      }
      const data = result.data ?? DEFAULT_DATA;
      const next = {
        title: data.title ?? DEFAULT_DATA.title,
        text: data.text ?? DEFAULT_DATA.text,
        imageUrl: data.imageUrl ?? null,
      };
      setData(next);
      setInitialSnapshot(snapshot(next));
      if (data.imageUrl) {
        setPreviewUrl(data.imageUrl);
      }
      if (data._tableMissing) {
        setError(
          "⚠️ Таблица home_reviews не создана. Выполните миграцию из scripts/migrations/home-reviews-extend.sql"
        );
      }
    } catch (e) {
      console.error("[AdminAbout] Исключение при загрузке:", e);
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
    if (data?.imageUrl) {
      setPreviewUrl(data.imageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [data?.imageUrl]);

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/home-about/upload", {
      method: "POST",
      body: formData,
    });
    const result = await parseAdminResponse<{ image_url?: string; error?: string }>(res, {
      method: "POST",
      url: "/api/admin/home-about/upload",
    });
    if (!result.ok || !result.isJson) {
      const errorMsg = result.data && typeof result.data === "object" && "error" in result.data
        ? (result.data as any).error
        : result.message ?? "Ошибка загрузки";
      throw new Error(errorMsg);
    }
    const responseData = result.data ?? {};
    return responseData.image_url ?? "";
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
      .catch((err) => {
        setError(`Ошибка загрузки изображения: ${err.message}`);
      })
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
      const err = e as Error;
      setError(err.message || "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  }

  function resetToInitial() {
    if (initialSnapshot === "") return;
    const parsed = JSON.parse(initialSnapshot) as AboutData;
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
          <label className="block text-sm font-medium text-[#111] mb-1">Текст</label>
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
