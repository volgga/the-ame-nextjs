"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";

type FlowerRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

type FlowersWhitelistModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Модалка управления списком «Цветы в составе» для фильтров.
 * Только удаление / скрытие из фильтров (is_active). Добавление новых значений в UI недоступно.
 */
export function FlowersWhitelistModal({ isOpen, onClose }: FlowersWhitelistModalProps) {
  const [flowers, setFlowers] = useState<FlowerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadFlowers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/flowers");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setFlowers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки списка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFlowers();
      setSearch("");
      setConfirmDeleteId(null);
    }
  }, [isOpen, loadFlowers]);

  const filtered = flowers.filter(
    (f) =>
      !search.trim() ||
      f.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      f.slug.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleHideFromFilters = async (flower: FlowerRow) => {
    if (!flower.is_active) return;
    setActionId(flower.id);
    try {
      const res = await fetch(`/api/admin/flowers/${flower.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Ошибка");
      }
      setFlowers((prev) => prev.map((f) => (f.id === flower.id ? { ...f, is_active: false } : f)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (flower: FlowerRow) => {
    setActionId(flower.id);
    try {
      const res = await fetch(`/api/admin/flowers/${flower.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Ошибка удаления");
      }
      setFlowers((prev) => prev.filter((f) => f.id !== flower.id));
      setConfirmDeleteId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка удаления");
    } finally {
      setActionId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Управление цветами в составе">
      <div className="space-y-3">
        <p className="text-sm text-color-text-secondary">
          Здесь можно только скрывать или удалять значения из списка фильтра «Цветы в составе» на сайте. Добавление
          новых значений вручную недоступно.
        </p>
        <div>
          <label className="sr-only" htmlFor="flowers-search">
            Поиск
          </label>
          <input
            id="flowers-search"
            type="search"
            placeholder="Поиск по названию или slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-border-block bg-white px-3 py-2 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)]"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-color-text-secondary">Загрузка…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-color-text-secondary">
            {flowers.length === 0 ? "Список пуст." : "Нет совпадений по поиску."}
          </p>
        ) : (
          <ul className="max-h-[50vh] overflow-y-auto rounded-lg border border-border-block divide-y divide-border-block bg-[rgba(31,42,31,0.02)]">
            {filtered.map((flower) => (
              <li
                key={flower.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-color-text-main"
              >
                <span className="min-w-0 flex-1">
                  {flower.name}
                  {!flower.is_active && (
                    <span className="ml-2 text-xs text-color-text-secondary">(скрыт из фильтров)</span>
                  )}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {flower.is_active && (
                    <button
                      type="button"
                      onClick={() => handleHideFromFilters(flower)}
                      disabled={actionId != null}
                      className="rounded border border-border-block px-2 py-1 text-xs text-color-text-main hover:bg-[rgba(31,42,31,0.06)] disabled:opacity-50"
                    >
                      {actionId === flower.id ? "…" : "Скрыть из фильтров"}
                    </button>
                  )}
                  {confirmDeleteId === flower.id ? (
                    <>
                      <span className="text-xs text-color-text-secondary">Удалить?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(flower)}
                        disabled={actionId != null}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded border border-border-block px-2 py-1 text-xs text-color-text-main hover:bg-[rgba(31,42,31,0.06)]"
                      >
                        Нет
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(flower.id)}
                      disabled={actionId != null}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
