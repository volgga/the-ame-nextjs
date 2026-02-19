"use client";

import { useCallback, useEffect, useState } from "react";
import { parseAdminResponse } from "@/lib/adminFetch";

type MinimumOrderRule = {
  id: string;
  date: string;
  minimum_amount: number;
  created_at: string;
  updated_at: string;
};

/** Контент модалки «Минимальный заказ»: создание, список, редактирование и удаление правил. */
export function MinimumOrderModalContent() {
  const [rules, setRules] = useState<MinimumOrderRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/minimum-order-rules");
      const result = await parseAdminResponse<MinimumOrderRule[]>(res, {
        method: "GET",
        url: "/api/admin/minimum-order-rules",
      });
      if (!result.ok || !Array.isArray(result.data)) {
        const apiError =
          result.data && !Array.isArray(result.data) && typeof (result.data as { error?: string }).error === "string"
            ? (result.data as { error: string }).error
            : null;
        throw new Error(apiError ?? result.message ?? "Ошибка загрузки");
      }
      setRules(result.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!deleteConfirmId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteConfirmId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [deleteConfirmId]);

  const getTodayISO = () => new Date().toISOString().split("T")[0];

  const resetForm = () => {
    setFormDate("");
    setFormAmount(0);
    setEditingId(null);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formDate || formAmount < 0) {
      setError("Укажите дату и минимальную сумму");
      return;
    }
    setError("");
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/minimum-order-rules/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: formDate, minimum_amount: formAmount }),
        });
        const result = await parseAdminResponse<MinimumOrderRule>(res, {
          method: "PATCH",
          url: `/api/admin/minimum-order-rules/${editingId}`,
        });
        if (!result.ok || !result.data) {
          const errPayload = result.data as Record<string, unknown> | null;
          const apiError = errPayload && typeof errPayload.error === "string" ? errPayload.error : null;
          throw new Error(apiError ?? result.message ?? "Ошибка");
        }
        const updatedRule = result.data as MinimumOrderRule;
        setRules((s) =>
          s.map((r) => (r.id === editingId ? updatedRule : r)).sort((a, b) => a.date.localeCompare(b.date))
        );
      } else {
        const res = await fetch("/api/admin/minimum-order-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: formDate, minimum_amount: formAmount }),
        });
        const result = await parseAdminResponse<MinimumOrderRule>(res, {
          method: "POST",
          url: "/api/admin/minimum-order-rules",
        });
        if (!result.ok || !result.data) {
          const errPayload = result.data as Record<string, unknown> | null;
          const apiError = errPayload && typeof errPayload.error === "string" ? errPayload.error : null;
          throw new Error(apiError ?? result.message ?? "Ошибка");
        }
        const newRule = result.data as MinimumOrderRule;
        setRules((s) => [...s, newRule].sort((a, b) => a.date.localeCompare(b.date)));
      }
      resetForm();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirmId(null);
    setError("");
    try {
      const res = await fetch(`/api/admin/minimum-order-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      setRules((s) => s.filter((r) => r.id !== id));
    } catch (e) {
      setError(String(e));
    }
  }

  function startEdit(rule: MinimumOrderRule) {
    setFormDate(rule.date);
    setFormAmount(rule.minimum_amount);
    setEditingId(rule.id);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-40 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSave} className="rounded-xl border border-border-block bg-white p-4 flex flex-col gap-3">
        <h4 className="font-medium text-[#111]">{editingId ? "Редактировать правило" : "Новое правило"}</h4>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3 items-end justify-end">
          <div>
            <label className="block text-sm font-medium text-[#111] mb-1">Дата</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              min={getTodayISO()}
              className="rounded border border-gray-300 px-3 py-2 text-[#111]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111] mb-1">Минимальная сумма заказа (₽)</label>
            <input
              type="number"
              min={0}
              value={formAmount || ""}
              onChange={(e) => setFormAmount(parseInt(e.target.value, 10) || 0)}
              className="rounded border border-gray-300 px-3 py-2 text-[#111] w-32"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded px-4 py-2 text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
            >
              Сохранить
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
              >
                Отмена
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <h4 className="font-medium text-[#111]">Существующие правила</h4>
        {rules.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">Нет правил. Добавьте дату и минимальную сумму выше.</p>
        ) : (
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2"
              >
                <span className="text-[#111]">
                  {new Date(rule.date).toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  — от {rule.minimum_amount.toLocaleString("ru-RU")} ₽
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(rule)}
                    className="rounded px-2 py-1 text-sm text-[#111] hover:bg-gray-200"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(rule.id)}
                    className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Удалить правило?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-200"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
