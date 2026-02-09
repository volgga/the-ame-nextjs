"use client";

import { useCallback, useEffect, useImperativeHandle, useState, forwardRef } from "react";

type ReviewsData = {
  id: string | null;
  rating_count: number;
  review2_text: string;
  review3_text: string;
};

const DEFAULT_DATA: ReviewsData = {
  id: null,
  rating_count: 50,
  review2_text:
    "Прекрасная мастерская цветов. Заказываю букеты не первый раз. Все очень стильно, красиво, качественно. Радует глаз и согревает душу. Все, кому я дарю букеты от Flowerna, в восторге! Однозначная рекомендация. Помимо качества и стиля, всегда все четко и вовремя. Что тоже очень и очень важно. Спасибо за то, что дарите красоту и хорошее настроение",
  review3_text:
    "Всем сердцем люблю Flowerna ❤️ Цветочный с особенной, теплой атмосферой 😊 Букеты как произведение искусства, каждый создан с душой и тонким чувством прекрасного 😊 Сервис Flowerna – это высший уровень, такого дружелюбного и молниеносного взаимодействия с клиентом я ранее не встречала 😊 Flowerna, Вы просто разрыв сердца ❤️ Желаю процветания такому крутому бизнесу!!! ❤️",
};

function snapshot(d: ReviewsData): string {
  return JSON.stringify({ rating_count: d.rating_count, review2_text: d.review2_text, review3_text: d.review3_text });
}

export type ReviewsFormRef = {
  save: () => Promise<void>;
  resetToInitial: () => void;
};

type ReviewsFormProps = {
  onDirtyChange?: (dirty: boolean) => void;
  formRef?: React.RefObject<ReviewsFormRef | null>;
};

/**
 * ReviewsForm — форма редактирования отзывов для использования в модалке.
 */
export const ReviewsForm = forwardRef<ReviewsFormRef, ReviewsFormProps>(function ReviewsForm(
  { onDirtyChange, formRef: formRefProp },
  ref
) {
  const resolvedRef = formRefProp ?? ref;
  const [data, setData] = useState<ReviewsData | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = data !== null && initialSnapshot !== "" && snapshot(data) !== initialSnapshot;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const performSave = useCallback(async (): Promise<void> => {
    if (!data) return;
    const payload = {
      rating_count: data.rating_count,
      review2_text: data.review2_text.trim(),
      review3_text: data.review3_text.trim(),
    };
    if (!payload.review2_text || !payload.review3_text) return;
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const responseData = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(responseData.error || "Ошибка сохранения");
    const updated = {
      id: responseData.id ?? data.id,
      rating_count: responseData.rating_count ?? data.rating_count,
      review2_text: responseData.review2_text ?? data.review2_text,
      review3_text: responseData.review3_text ?? data.review3_text,
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
        const parsed = JSON.parse(initialSnapshot) as ReviewsData;
        setData((prev) => (prev ? { ...prev, ...parsed } : null));
      },
    }),
    [initialSnapshot, performSave]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[AdminReviews] Ошибка загрузки:", res.status, errData);
        setData(DEFAULT_DATA);
        setInitialSnapshot(snapshot(DEFAULT_DATA));
        return;
      }
      const data = await res.json();
      const next = {
        id: data.id ?? null,
        rating_count: data.rating_count ?? DEFAULT_DATA.rating_count,
        review2_text: data.review2_text ?? DEFAULT_DATA.review2_text,
        review3_text: data.review3_text ?? DEFAULT_DATA.review3_text,
      };
      setData(next);
      setInitialSnapshot(snapshot(next));
      if (data._tableMissing) {
        setError(
          "⚠️ Таблица home_reviews не создана в базе данных. Выполните миграцию из scripts/migrations/home-reviews.sql в Supabase SQL Editor. Форма работает с дефолтными значениями, но сохранение будет недоступно до создания таблицы."
        );
      }
    } catch (e) {
      console.error("[AdminReviews] Исключение при загрузке:", e);
      setData(DEFAULT_DATA);
      setError("Не удалось загрузить данные. Используются значения по умолчанию.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    if (!data.review2_text?.trim()) {
      setError("Отзыв #2 не может быть пустым");
      return;
    }
    if (!data.review3_text?.trim()) {
      setError("Отзыв #3 не может быть пустым");
      return;
    }
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
    if (initialSnapshot === "" || !data) return;
    const parsed = JSON.parse(initialSnapshot) as Pick<ReviewsData, "rating_count" | "review2_text" | "review3_text">;
    setData((prev) => (prev ? { ...prev, ...parsed } : null));
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
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#111] mb-2">Количество оценок</label>
          <input
            type="number"
            min="0"
            value={formData.rating_count}
            onChange={(e) =>
              setData((d) => (d ? { ...d, rating_count: parseInt(e.target.value, 10) || 0 } : DEFAULT_DATA))
            }
            className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-[#111]"
          />
          <p className="mt-1 text-xs text-gray-500">
            Используется в тексте &quot;на основе {formData.rating_count} оценок&quot;
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111] mb-2">Отзыв #2</label>
          <textarea
            value={formData.review2_text}
            onChange={(e) =>
              setData((d) =>
                d ? { ...d, review2_text: e.target.value } : { ...DEFAULT_DATA, review2_text: e.target.value }
              )
            }
            rows={6}
            className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111] mb-2">Отзыв #3</label>
          <textarea
            value={formData.review3_text}
            onChange={(e) =>
              setData((d) =>
                d ? { ...d, review3_text: e.target.value } : { ...DEFAULT_DATA, review3_text: e.target.value }
              )
            }
            rows={6}
            className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] font-mono text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
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
