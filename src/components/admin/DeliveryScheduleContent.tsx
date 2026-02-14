"use client";

import { useCallback, useEffect, useState } from "react";
import { parseAdminResponse } from "@/lib/adminFetch";

type DeliveryDay = {
  id: string;
  date: string;
  created_at: string;
  updated_at: string;
  time_slots?: DeliveryTimeSlot[];
};

type DeliveryTimeSlot = {
  id: string;
  day_id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Контент настроек «Время доставки» для использования в модалке на странице Условия доставки. */
export function DeliveryScheduleContent() {
  const [days, setDays] = useState<DeliveryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [addingDay, setAddingDay] = useState(false);
  const [newDayDate, setNewDayDate] = useState("");
  const [addingSlotDayId, setAddingSlotDayId] = useState<string | null>(null);
  const [newSlotStart, setNewSlotStart] = useState("");
  const [newSlotEnd, setNewSlotEnd] = useState("");
  const [editingSlot, setEditingSlot] = useState<{ slotId: string; dayId: string; start: string; end: string } | null>(
    null
  );
  const [deleteConfirmSlotId, setDeleteConfirmSlotId] = useState<string | null>(null);
  const [deleteConfirmDayId, setDeleteConfirmDayId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = "/api/admin/delivery-schedule";
      const res = await fetch(url);
      const result = await parseAdminResponse<DeliveryDay[]>(res, { method: "GET", url });
      if (!result.ok || !Array.isArray(result.data)) {
        const apiError =
          result.data && !Array.isArray(result.data) && typeof (result.data as { error?: string }).error === "string"
            ? (result.data as { error: string }).error
            : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка загрузки";
        throw new Error(message);
      }
      setDays(result.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const anyModalOpen = !!editingSlot || !!deleteConfirmSlotId || !!deleteConfirmDayId;
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;
    if (anyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [anyModalOpen]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const getTodayISO = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  async function handleAddDay() {
    if (!newDayDate) {
      setError("Выберите дату");
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/admin/delivery-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDayDate }),
      });
      const result = await parseAdminResponse<DeliveryDay & { error?: string }>(res, {
        method: "POST",
        url: "/api/admin/delivery-schedule",
      });
      if (!result.ok || !result.data) {
        const apiError = result.data && typeof (result.data as { error?: string }).error === "string" ? (result.data as { error: string }).error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка";
        throw new Error(message);
      }
      setDays((s) => [...s, result.data!].sort((a, b) => a.date.localeCompare(b.date)));
      setNewDayDate("");
      setAddingDay(false);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeleteDay(dayId: string) {
    setDeleteConfirmDayId(null);
    setError("");
    try {
      const res = await fetch(`/api/admin/delivery-schedule/days/${dayId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ошибка удаления");
      setDays((s) => s.filter((d) => d.id !== dayId));
      setExpandedDays((s) => {
        const newSet = new Set(s);
        newSet.delete(dayId);
        return newSet;
      });
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleAddSlot(dayId: string) {
    if (!newSlotStart || !newSlotEnd) {
      setError("Заполните время начала и окончания");
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/admin/delivery-schedule/days/${dayId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: newSlotStart,
          end_time: newSlotEnd,
        }),
      });
      const result = await parseAdminResponse<DeliveryTimeSlot & { error?: string }>(res, {
        method: "POST",
        url: `/api/admin/delivery-schedule/days/${dayId}/slots`,
      });
      if (!result.ok || !result.data) {
        const apiError = result.data && typeof (result.data as { error?: string }).error === "string" ? (result.data as { error: string }).error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка";
        throw new Error(message);
      }
      setDays((s) =>
        s.map((d) =>
          d.id === dayId
            ? {
                ...d,
                time_slots: [...(d.time_slots || []), result.data!].sort((a, b) => a.sort_order - b.sort_order),
              }
            : d
        )
      );
      setNewSlotStart("");
      setNewSlotEnd("");
      setAddingSlotDayId(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleUpdateSlot(slotId: string, dayId: string, start: string, end: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/delivery-schedule/slots/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: start,
          end_time: end,
        }),
      });
      const result = await parseAdminResponse<DeliveryTimeSlot & { error?: string }>(res, {
        method: "PUT",
        url: `/api/admin/delivery-schedule/slots/${slotId}`,
      });
      if (!result.ok || !result.data) {
        const apiError = result.data && typeof (result.data as { error?: string }).error === "string" ? (result.data as { error: string }).error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка";
        throw new Error(message);
      }
      setDays((s) =>
        s.map((d) =>
          d.id === dayId
            ? {
                ...d,
                time_slots: (d.time_slots || []).map((slot) => (slot.id === slotId ? result.data! : slot)),
              }
            : d
        )
      );
      setEditingSlot(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeleteSlot(slotId: string, dayId: string) {
    setDeleteConfirmSlotId(null);
    setError("");
    try {
      const res = await fetch(`/api/admin/delivery-schedule/slots/${slotId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ошибка удаления");
      setDays((s) =>
        s.map((d) =>
          d.id === dayId ? { ...d, time_slots: (d.time_slots || []).filter((slot) => slot.id !== slotId) } : d
        )
      );
    } catch (e) {
      setError(String(e));
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
        <h3 className="text-lg font-semibold text-[#111]">Время доставки</h3>
        <button
          type="button"
          onClick={() => {
            setAddingDay(true);
            setNewDayDate(getTodayISO());
          }}
          className="rounded px-4 py-2 text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
        >
          Добавить день
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {addingDay && (
        <div className="rounded-xl border border-border-block bg-white p-4">
          <h4 className="mb-3 font-medium text-[#111]">Добавить день</h4>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDayDate}
              onChange={(e) => setNewDayDate(e.target.value)}
              min={getTodayISO()}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-[#111]"
            />
            <button
              type="button"
              onClick={handleAddDay}
              className="rounded px-4 py-2 text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingDay(false);
                setNewDayDate("");
              }}
              className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {days.length === 0 ? (
        <p className="py-8 text-center text-gray-500">Нет дней. Нажмите «Добавить день».</p>
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const isExpanded = expandedDays.has(day.id);
            const slots = day.time_slots || [];
            return (
              <div key={day.id} className="rounded-xl border border-border-block bg-white overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-[#111]">{formatDate(day.date)}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {slots.length === 0
                        ? "Нет интервалов"
                        : `${slots.length} ${slots.length === 1 ? "интервал" : slots.length < 5 ? "интервала" : "интервалов"}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedDays((s) => {
                          const newSet = new Set(s);
                          if (isExpanded) {
                            newSet.delete(day.id);
                          } else {
                            newSet.add(day.id);
                          }
                          return newSet;
                        });
                      }}
                      className="rounded px-3 py-2 text-sm text-[#111] hover:bg-gray-200"
                    >
                      {isExpanded ? "Свернуть" : "Развернуть"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmDayId(day.id)}
                      className="rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Удалить день
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    {slots.length > 0 && (
                      <div className="space-y-2">
                        {slots.map((slot) => {
                          const isEditing = editingSlot?.slotId === slot.id;
                          return (
                            <div key={slot.id} className="flex items-center gap-2 rounded border border-gray-200 p-2">
                              {isEditing ? (
                                <>
                                  <input
                                    type="time"
                                    value={editingSlot!.start}
                                    onChange={(e) => setEditingSlot({ ...editingSlot!, start: e.target.value })}
                                    className="rounded border border-gray-300 px-2 py-1 text-sm text-[#111]"
                                  />
                                  <span className="text-gray-500">—</span>
                                  <input
                                    type="time"
                                    value={editingSlot!.end}
                                    onChange={(e) => setEditingSlot({ ...editingSlot!, end: e.target.value })}
                                    className="rounded border border-gray-300 px-2 py-1 text-sm text-[#111]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSlot(editingSlot!.slotId, day.id, editingSlot!.start, editingSlot!.end)
                                    }
                                    className="rounded px-2 py-1 text-xs text-white bg-accent-btn hover:bg-accent-btn-hover"
                                  >
                                    Сохранить
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSlot(null)}
                                    className="rounded px-2 py-1 text-xs text-[#111] hover:bg-gray-200"
                                  >
                                    Отмена
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm text-[#111]">
                                    {slot.start_time} — {slot.end_time}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingSlot({
                                        slotId: slot.id,
                                        dayId: day.id,
                                        start: slot.start_time,
                                        end: slot.end_time,
                                      })
                                    }
                                    className="rounded px-2 py-1 text-xs text-[#111] hover:bg-gray-200"
                                  >
                                    Изменить
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmSlotId(slot.id)}
                                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                  >
                                    Удалить
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {addingSlotDayId === day.id ? (
                      <div className="flex items-center gap-2 rounded border border-gray-200 p-2">
                        <input
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          placeholder="Начало"
                          className="rounded border border-gray-300 px-2 py-1 text-sm text-[#111]"
                        />
                        <span className="text-gray-500">—</span>
                        <input
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          placeholder="Окончание"
                          className="rounded border border-gray-300 px-2 py-1 text-sm text-[#111]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSlot(day.id)}
                          className="rounded px-2 py-1 text-xs text-white bg-accent-btn hover:bg-accent-btn-hover"
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingSlotDayId(null);
                            setNewSlotStart("");
                            setNewSlotEnd("");
                          }}
                          className="rounded px-2 py-1 text-xs text-[#111] hover:bg-gray-200"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingSlotDayId(day.id);
                          setNewSlotStart("");
                          setNewSlotEnd("");
                        }}
                        className="rounded px-3 py-2 text-sm text-[#111] border border-gray-300 hover:bg-gray-50"
                      >
                        + Добавить интервал
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {deleteConfirmDayId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmDayId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Точно удалить день и все его интервалы?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmDayId(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-200"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDay(deleteConfirmDayId)}
                className="rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmSlotId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmSlotId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Точно удалить интервал?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSlotId(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-200"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={() => {
                  const day = days.find((d) => d.time_slots?.some((s) => s.id === deleteConfirmSlotId));
                  if (day) {
                    handleDeleteSlot(deleteConfirmSlotId, day.id);
                  }
                }}
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
