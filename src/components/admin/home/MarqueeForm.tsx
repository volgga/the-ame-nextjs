"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { useRouter } from "next/navigation";
import { parseAdminResponse } from "@/lib/adminFetch";

type MarqueeData = {
  enabled: boolean;
  text: string;
  link: string;
};

const DEFAULT_DATA: MarqueeData = {
  enabled: false,
  text: "",
  link: "",
};

function snapshot(data: MarqueeData): string {
  return JSON.stringify({ enabled: data.enabled, text: data.text, link: data.link });
}

export type MarqueeFormRef = {
  save: () => Promise<void>;
  resetToInitial: () => void;
};

type MarqueeFormProps = {
  onDirtyChange?: (dirty: boolean) => void;
  formRef?: React.RefObject<MarqueeFormRef | null>;
};

/**
 * Форма редактирования блока «Бегущая дорожка» над шапкой.
 */
export const MarqueeForm = forwardRef<MarqueeFormRef, MarqueeFormProps>(function MarqueeForm(
  { onDirtyChange, formRef: formRefProp },
  ref
) {
  const router = useRouter();
  const resolvedRef = formRefProp ?? ref;
  const [data, setData] = useState<MarqueeData | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isDirty = data !== null && initialSnapshot !== "" && snapshot(data) !== initialSnapshot;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const performSave = useCallback(async (): Promise<void> => {
    if (!data) return;
    const payload = {
      enabled: data.enabled,
      text: data.text.trim(),
      link: data.link.trim() || undefined,
    };
    if (payload.enabled && !payload.text) {
      throw new Error("При включённой дорожке текст обязателен");
    }
    const res = await fetch("/api/admin/home-marquee", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const result = await parseAdminResponse(res, { method: "PATCH", url: "/api/admin/home-marquee" });
    if (!result.ok || !result.isJson) {
      throw new Error(result.message ?? "Ошибка сохранения");
    }
    const responseData = result.data as any;
    const updated = {
      enabled: responseData.enabled === true || responseData.enabled === "true",
      text: responseData.text ?? "",
      link: responseData.link ?? "",
    };
    setData(updated);
    setInitialSnapshot(snapshot(updated));
    router.refresh();
  }, [data, router]);

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
        const parsed = JSON.parse(initialSnapshot) as MarqueeData;
        setData(parsed);
      },
    }),
    [initialSnapshot, performSave]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/home-marquee", { cache: "no-store" });
      const result = await parseAdminResponse(res, { method: "GET", url: "/api/admin/home-marquee" });
      if (!result.ok || !result.isJson) {
        setData(DEFAULT_DATA);
        setInitialSnapshot(snapshot(DEFAULT_DATA));
        if (!result.ok) {
          setError(result.message ?? "Ошибка загрузки");
        }
        return;
      }
      const raw = result.data as any;
      const next: MarqueeData = {
        enabled: raw.enabled === true || (typeof raw.enabled === "string" && raw.enabled.toLowerCase() === "true"),
        text: raw.text ?? "",
        link: raw.link ?? "",
      };
      setData(next);
      setInitialSnapshot(snapshot(next));
      if (raw._tableMissing) {
        setError(
          "⚠️ Таблица home_reviews не создана или миграция home-marquee не выполнена. Выполните scripts/migrations/home-marquee.sql"
        );
      }
    } catch (e) {
      console.error("[AdminMarquee] Ошибка загрузки:", e);
      setData(DEFAULT_DATA);
      setInitialSnapshot(snapshot(DEFAULT_DATA));
      setError("Не удалось загрузить данные.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data || saving) return;
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
    const parsed = JSON.parse(initialSnapshot) as MarqueeData;
    setData(parsed);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded bg-gray-200" />
        <div className="h-24 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  const formData = data ?? DEFAULT_DATA;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form ref={formRef} onSubmit={handleSave} className="space-y-4" noValidate>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="marquee-enabled"
            checked={formData.enabled}
            onChange={(e) =>
              setData((d) => (d ? { ...d, enabled: e.target.checked } : { ...DEFAULT_DATA, enabled: e.target.checked }))
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="marquee-enabled" className="text-sm font-medium text-[#111]">
            Показывать бегущую дорожку
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111] mb-1">Текст</label>
          <textarea
            value={formData.text}
            onChange={(e) =>
              setData((d) => (d ? { ...d, text: e.target.value } : { ...DEFAULT_DATA, text: e.target.value }))
            }
            rows={3}
            placeholder="Текст бегущей строки над шапкой"
            className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
          />
          <p className="mt-0.5 text-xs text-gray-500">При включённой дорожке текст обязателен.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111] mb-1">Ссылка (URL)</label>
          <input
            type="text"
            value={formData.link}
            onChange={(e) =>
              setData((d) => (d ? { ...d, link: e.target.value } : { ...DEFAULT_DATA, link: e.target.value }))
            }
            placeholder="https://... или /magazine/..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
          />
          <p className="mt-0.5 text-xs text-gray-500">
            Пусто — дорожка не кликабельна. Допустимы http(s):// или путь /...
          </p>
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
