"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { normalizePromoCode } from "@/lib/promoCode";

export type PromoCodeRow = {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FormData = {
  code: string;
  name: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

const DEFAULT_FORM: FormData = {
  code: "",
  name: "",
  discountType: "PERCENT",
  value: 10,
  isActive: true,
  startsAt: "",
  endsAt: "",
};

function formSnapshot(f: FormData): string {
  return JSON.stringify(f);
}

/** Форматировать дату для input datetime-local (YYYY-MM-DDTHH:mm). */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return "";
  }
}

function fromDatetimeLocal(s: string): string {
  if (!s.trim()) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export type PromoFormRef = {
  save: () => Promise<void>;
  isDirty: () => boolean;
};

type PromoFormProps = {
  onDirtyChange?: (dirty: boolean) => void;
  formRef?: React.RefObject<PromoFormRef | null>;
};

export const PromoForm = forwardRef<PromoFormRef, PromoFormProps>(function PromoForm(
  { onDirtyChange, formRef: formRefProp },
  ref
) {
  const resolvedRef = formRefProp ?? ref;
  const [list, setList] = useState<PromoCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [initialFormSnapshot, setInitialFormSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isFormDirty = initialFormSnapshot !== "" && formSnapshot(form) !== initialFormSnapshot;
  const isDirty = view === "form" && isFormDirty;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/promocodes", { cache: "no-store", credentials: "include" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = typeof data?.error === "string" ? data.error : "Ошибка загрузки";
        setError(message);
        setList([]);
        return;
      }

      const items = Array.isArray(data) ? data : [];
      setList(items);
      setError("");
    } catch (e) {
      setError((e as Error).message ?? "Не удалось загрузить");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openCreate = useCallback(() => {
    setForm(DEFAULT_FORM);
    setInitialFormSnapshot(formSnapshot(DEFAULT_FORM));
    setEditingId(null);
    setView("form");
    setError("");
  }, []);

  const openEdit = useCallback((row: PromoCodeRow) => {
    setForm({
      code: row.code,
      name: row.name,
      discountType: row.discountType,
      value: row.value,
      isActive: row.isActive,
      startsAt: toDatetimeLocal(row.startsAt),
      endsAt: toDatetimeLocal(row.endsAt),
    });
    setInitialFormSnapshot(
      formSnapshot({
        code: row.code,
        name: row.name,
        discountType: row.discountType,
        value: row.value,
        isActive: row.isActive,
        startsAt: toDatetimeLocal(row.startsAt),
        endsAt: toDatetimeLocal(row.endsAt),
      })
    );
    setEditingId(row.id);
    setView("form");
    setError("");
  }, []);

  const closeForm = useCallback(() => {
    setView("list");
    setEditingId(null);
    setInitialFormSnapshot("");
  }, []);

  const performSave = useCallback(async () => {
    const code = normalizePromoCode(form.code);
    if (!code) {
      setError("Введите код промокода");
      throw new Error("Код обязателен");
    }
    if (!form.name.trim()) {
      setError("Введите название");
      throw new Error("Название обязательно");
    }
    if (form.discountType === "PERCENT" && (form.value < 1 || form.value > 100)) {
      setError("Для процентов укажите значение от 1 до 100");
      throw new Error("PERCENT: 1–100");
    }
    if (form.discountType === "FIXED" && form.value < 1) {
      setError("Для фиксированной скидки укажите значение ≥ 1 ₽");
      throw new Error("FIXED: ≥ 1");
    }

    const payload = {
      code,
      name: form.name.trim(),
      discountType: form.discountType,
      value: Number(form.value) || (form.discountType === "PERCENT" ? 10 : 1),
      isActive: form.isActive,
      startsAt: form.startsAt.trim() ? fromDatetimeLocal(form.startsAt) : null,
      endsAt: form.endsAt.trim() ? fromDatetimeLocal(form.endsAt) : null,
    };

    if (editingId) {
      const res = await fetch(`/api/admin/promocodes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Ошибка сохранения");
      await loadList();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      closeForm();
    } else {
      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
              ? data.message
              : res.status >= 500
                ? `Ошибка сервера (${res.status})`
                : `Ошибка создания (${res.status})`;
        throw new Error(msg);
      }
      await loadList();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      closeForm();
    }
  }, [form, editingId, loadList, closeForm]);

  useImperativeHandle(
    resolvedRef,
    () => ({
      save: async () => {
        if (view !== "form") return;
        setSaving(true);
        setError("");
        try {
          await performSave();
        } catch (e) {
          setError((e as Error).message ?? "Ошибка");
          throw e;
        } finally {
          setSaving(false);
        }
      },
      isDirty: () => isDirty,
    }),
    [view, isDirty, performSave]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await performSave();
    } catch (e) {
      setError((e as Error).message ?? "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить промокод?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/promocodes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Ошибка удаления");
      }
      await loadList();
      if (editingId === id) closeForm();
    } catch (e) {
      setError((e as Error).message ?? "Ошибка удаления");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCodeBlur = () => {
    setForm((f) => ({ ...f, code: normalizePromoCode(f.code) }));
  };

  if (loading && list.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded bg-gray-200" />
        <div className="h-24 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111] mb-1">Код</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              onBlur={handleCodeBlur}
              placeholder="Например 2ГИС"
              className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm uppercase"
            />
            <p className="mt-0.5 text-xs text-gray-500">Сохраняется в верхнем регистре (в т.ч. кириллица).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111] mb-1">Название</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Например: Скидка для партнёров"
              className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Тип скидки</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "PERCENT" | "FIXED" }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="PERCENT">Проценты (%)</option>
                <option value="FIXED">Фикс (₽)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Значение {form.discountType === "PERCENT" ? "(1–100)" : "(₽)"}
              </label>
              <input
                type="number"
                min={form.discountType === "PERCENT" ? 1 : 1}
                max={form.discountType === "PERCENT" ? 100 : undefined}
                step={form.discountType === "PERCENT" ? 1 : 1}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))}
                className="w-28 rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="promo-active"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="promo-active" className="text-sm font-medium text-[#111]">
              Активен
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Действует с (необязательно)</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Действует до (необязательно)</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:opacity-50"
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedFlash && <p className="text-sm text-green-600 font-medium">Сохранено</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
        >
          Добавить промокод
        </button>
      </div>
      {list.length === 0 ? (
        <p className="py-6 text-center text-gray-500">Нет промокодов. Нажмите «Добавить промокод».</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-[#111]">
              <tr>
                <th className="px-3 py-2 font-medium">Код</th>
                <th className="px-3 py-2 font-medium">Название</th>
                <th className="px-3 py-2 font-medium">Тип</th>
                <th className="px-3 py-2 font-medium">Значение</th>
                <th className="px-3 py-2 font-medium">Активен</th>
                <th className="px-3 py-2 font-medium">Срок</th>
                <th className="px-3 py-2 w-24">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-t border-gray-200">
                  <td className="px-3 py-2 font-mono uppercase">{row.code}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.discountType === "PERCENT" ? "%" : "₽"}</td>
                  <td className="px-3 py-2">{row.discountType === "PERCENT" ? `${row.value}%` : `${row.value} ₽`}</td>
                  <td className="px-3 py-2">{row.isActive ? "Да" : "Нет"}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {row.startsAt || row.endsAt
                      ? [
                          row.startsAt ? new Date(row.startsAt).toLocaleDateString("ru-RU") : "",
                          row.endsAt ? new Date(row.endsAt).toLocaleDateString("ru-RU") : "",
                        ]
                          .filter(Boolean)
                          .join(" – ")
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-accent-btn hover:underline mr-2"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === row.id ? "…" : "Удалить"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
