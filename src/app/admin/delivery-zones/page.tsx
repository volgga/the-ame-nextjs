"use client";

import { useCallback, useEffect, useState } from "react";
import { parseAdminResponse } from "@/lib/adminFetch";

type DeliveryZone = {
  id: string;
  zone_title: string;
  paid_up_to: number;
  delivery_price: number;
  free_from: number;
  subareas_text: string | null;
  sort_order: number;
};

const emptyForm = () => ({
  zone_title: "",
  paid_up_to: 0,
  delivery_price: 0,
  free_from: 0,
  subareas_text: "",
});

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = "/api/admin/delivery-zones";
      const res = await fetch(url);
      const result = await parseAdminResponse<DeliveryZone[]>(res, { method: "GET", url });
      if (!result.ok || !Array.isArray(result.data)) {
        const apiError =
          result.data && !Array.isArray(result.data) && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки";
        throw new Error(message);
      }
      setZones(result.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function closeModal() {
    setCreating(false);
    setEditing(null);
    setForm(emptyForm());
  }

  useEffect(() => {
    if (!creating && !editing) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [creating, editing]);

  useEffect(() => {
    if (!deleteConfirmId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteConfirmId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [deleteConfirmId]);

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (creating) {
        const url = "/api/admin/delivery-zones";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zone_title: form.zone_title.trim(),
            paid_up_to: form.paid_up_to,
            delivery_price: form.delivery_price,
            free_from: form.free_from,
            subareas_text: form.subareas_text.trim() || null,
          }),
        });
        const result = await parseAdminResponse<DeliveryZone & { error?: string }>(res, { method: "POST", url });
        if (!result.ok || !result.data) {
          const apiError = result.data && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
          const message = apiError
            ? `${apiError}${result.message ? ` (${result.message})` : ""}`
            : result.message ?? "Ошибка";
          throw new Error(message);
        }
        const data = result.data;
        setZones((s) => [...s, data].sort((a, b) => a.sort_order - b.sort_order));
        closeModal();
      } else if (editing) {
        const url = `/api/admin/delivery-zones/${editing.id}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zone_title: form.zone_title.trim(),
            paid_up_to: form.paid_up_to,
            delivery_price: form.delivery_price,
            free_from: form.free_from,
            subareas_text: form.subareas_text.trim() || null,
          }),
        });
        const result = await parseAdminResponse<DeliveryZone & { error?: string }>(res, {
          method: "PATCH",
          url,
        });
        if (!result.ok || !result.data) {
          const apiError = result.data && typeof (result.data as any).error === "string"
            ? (result.data as any).error
            : null;
          const message = apiError
            ? `${apiError}${result.message ? ` (${result.message})` : ""}`
            : result.message ?? "Ошибка";
          throw new Error(message);
        }
        const data = result.data;
        setZones((s) =>
          s.map((z) =>
            z.id === editing.id
              ? {
                  ...z,
                  zone_title: data.zone_title,
                  paid_up_to: data.paid_up_to,
                  delivery_price: data.delivery_price,
                  free_from: data.free_from,
                  subareas_text: data.subareas_text,
                }
              : z
          )
        );
        closeModal();
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`/api/admin/delivery-zones/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ошибка удаления");
      setZones((s) => s.filter((z) => z.id !== id));
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleMoveUp(zone: DeliveryZone) {
    const idx = zones.findIndex((z) => z.id === zone.id);
    if (idx <= 0) return;
    setMovingId(zone.id);
    setError("");
    try {
      const newZones = [...zones];
      [newZones[idx - 1], newZones[idx]] = [newZones[idx], newZones[idx - 1]];
      const withOrder = newZones.map((z, i) => ({ ...z, sort_order: i }));
      setZones(withOrder);
      await fetch("/api/admin/delivery-zones/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: withOrder.map((z, i) => ({ id: z.id, sort_order: i })),
        }),
      });
    } catch (e) {
      setError(String(e));
      load();
    } finally {
      setMovingId(null);
    }
  }

  async function handleMoveDown(zone: DeliveryZone) {
    const idx = zones.findIndex((z) => z.id === zone.id);
    if (idx < 0 || idx >= zones.length - 1) return;
    setMovingId(zone.id);
    setError("");
    try {
      const newZones = [...zones];
      [newZones[idx], newZones[idx + 1]] = [newZones[idx + 1], newZones[idx]];
      const withOrder = newZones.map((z, i) => ({ ...z, sort_order: i }));
      setZones(withOrder);
      await fetch("/api/admin/delivery-zones/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: withOrder.map((z, i) => ({ id: z.id, sort_order: i })),
        }),
      });
    } catch (e) {
      setError(String(e));
      load();
    } finally {
      setMovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111]">Условия доставки</h2>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm(emptyForm());
          }}
          className="rounded px-4 py-2 text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
        >
          Добавить зону
        </button>
      </div>

      {error && !creating && !editing && <p className="text-sm text-red-600">{error}</p>}

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} aria-hidden />
          <div
            className="relative w-full max-w-[480px] max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveForm} className="flex flex-col min-h-0 overflow-y-auto">
              <div className="flex-1 p-6">
                <h3 className="mb-4 font-medium text-[#111]">{creating ? "Новая зона" : "Редактирование"}</h3>
                {error && (creating || editing) && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название района *</label>
                    <input
                      type="text"
                      value={form.zone_title}
                      onChange={(e) => setForm((f) => ({ ...f, zone_title: e.target.value }))}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#111]">до (₽)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.paid_up_to}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            paid_up_to: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111]">цена (₽)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.delivery_price}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            delivery_price: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111]">бесплатно от (₽)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.free_from}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            free_from: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Подзоны (опционально)</label>
                    <textarea
                      value={form.subareas_text}
                      onChange={(e) => setForm((f) => ({ ...f, subareas_text: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm text-[#111]"
                      placeholder="Донская, Виноградная, ..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="rounded px-4 py-2 text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
                >
                  Отмена
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmId(editing.id);
                      closeModal();
                    }}
                    className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {zones.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border-block bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-medium text-[#111] w-10">№</th>
                <th className="px-4 py-3 font-medium text-[#111]">Район</th>
                <th className="px-4 py-3 font-medium text-[#111]">до (₽) / цена (₽) / бесплатно от (₽)</th>
                <th className="px-4 py-3 font-medium text-[#111] w-32">Действия</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone, i) => (
                <tr key={zone.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={i === 0 || movingId !== null}
                        onClick={() => handleMoveUp(zone)}
                        className="rounded px-2 py-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[36px]"
                        aria-label="Вверх"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={i === zones.length - 1 || movingId !== null}
                        onClick={() => handleMoveDown(zone)}
                        className="rounded px-2 py-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[36px]"
                        aria-label="Вниз"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#111]">{zone.zone_title}</td>
                  <td className="px-4 py-3 text-[#111]">
                    до {zone.paid_up_to.toLocaleString("ru-RU")} ₽ — {zone.delivery_price.toLocaleString("ru-RU")} ₽ /
                    от {zone.free_from.toLocaleString("ru-RU")} ₽ — Бесплатно
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(zone);
                          setCreating(false);
                          setForm({
                            zone_title: zone.zone_title,
                            paid_up_to: zone.paid_up_to,
                            delivery_price: zone.delivery_price,
                            free_from: zone.free_from,
                            subareas_text: zone.subareas_text ?? "",
                          });
                        }}
                        className="rounded px-3 py-2 text-sm text-[#111] hover:bg-gray-200 min-h-[40px]"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(zone.id)}
                        className="rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50 min-h-[40px]"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-gray-500">Нет зон. Нажмите «Добавить зону».</p>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Точно удалить зону?</p>
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
