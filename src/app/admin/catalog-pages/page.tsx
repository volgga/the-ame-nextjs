"use client";

import { useCallback, useEffect, useState } from "react";
import { CatalogPagesGrid } from "@/components/admin/catalog-pages/CatalogPagesGrid";
import type { CatalogPage } from "@/components/admin/catalog-pages/CatalogPageCard";

function areOrdersEqual(a: CatalogPage[], b: CatalogPage[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((p, i) => p.id === b[i].id);
}

export default function AdminCatalogPagesPage() {
  const [pagesFromServer, setPagesFromServer] = useState<CatalogPage[]>([]);
  const [pagesDraft, setPagesDraft] = useState<CatalogPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [editing, setEditing] = useState<CatalogPage | null>(null);
  const [form, setForm] = useState({ title: "", is_active: true, description: "" });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isDirty = !areOrdersEqual(pagesFromServer, pagesDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog-pages");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setPagesFromServer(data);
      setPagesDraft(data);
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
    setEditing(null);
    setForm({ title: "", is_active: true, description: "" });
  }

  useEffect(() => {
    if (!editing) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [editing]);

  useEffect(() => {
    if (!deleteConfirmId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteConfirmId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [deleteConfirmId]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/catalog-pages/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          is_active: form.is_active,
          description: form.description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      const updated = {
        ...editing,
        title: data.title,
        is_active: data.is_active,
        description: data.description ?? null,
      };
      setPagesFromServer((s) => s.map((x) => (x.id === editing.id ? updated : x)));
      setPagesDraft((s) => s.map((x) => (x.id === editing.id ? updated : x)));
      closeModal();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleToggleActive(page: CatalogPage) {
    setTogglingId(page.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/catalog-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !page.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      const updated = { ...page, is_active: data.is_active };
      setPagesFromServer((s) => s.map((x) => (x.id === page.id ? updated : x)));
      setPagesDraft((s) => s.map((x) => (x.id === page.id ? updated : x)));
    } catch (e) {
      setError(String(e));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`/api/admin/catalog-pages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      const nextDraft = pagesDraft.filter((x) => x.id !== id);
      const withOrder = nextDraft.map((p, i) => ({ ...p, sort_order: i }));
      setPagesFromServer(withOrder);
      setPagesDraft(withOrder);
      setEditing(null);
      if (withOrder.length > 0) {
        const reorderRes = await fetch("/api/admin/catalog-pages/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: withOrder.map((p, i) => ({ id: p.id, sort_order: i })),
          }),
        });
        if (!reorderRes.ok) {
          const err = await reorderRes.json();
          setError(err.error ?? "Порядок не обновлён");
        }
      }
    } catch (e) {
      setError(String(e));
    }
  }

  function handleReorder(newOrder: CatalogPage[]) {
    setPagesDraft(newOrder);
  }

  async function handleSaveOrder() {
    if (!isDirty) return;
    setSaveStatus("saving");
    setError("");
    try {
      const items = pagesDraft.map((p, i) => ({ id: p.id, sort_order: i }));
      const res = await fetch("/api/admin/catalog-pages/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ошибка сохранения");
      }
      const withOrder = pagesDraft.map((p, i) => ({ ...p, sort_order: i }));
      setPagesFromServer(withOrder);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setError(String(e));
      setSaveStatus("idle");
    }
  }

  if (error && !editing) return <p className="text-red-600">{error}</p>;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-[100px] animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111]">Каталог / Страницы</h2>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} aria-hidden />
          <div
            className="relative w-full max-w-[480px] max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white hover:border-border-block-hover shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveForm} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <h3 className="mb-4 font-medium text-[#111]">Редактирование страницы</h3>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Slug</label>
                    <p className="mt-1 text-sm text-gray-600">/{editing.slug}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Не редактируется.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название (title)</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Описание (SEO)</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={4}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
                      placeholder="Необязательно"
                      maxLength={5000}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      />
                      <span className="text-sm text-[#111]">Активна</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {pagesDraft.length > 0 && (
        <CatalogPagesGrid
          pages={pagesDraft}
          onReorder={handleReorder}
          onEdit={(p) => {
            setEditing(p);
            setForm({ title: p.title, is_active: p.is_active, description: p.description ?? "" });
          }}
          onToggleActive={handleToggleActive}
          onDeleteClick={(p) => setDeleteConfirmId(p.id)}
          togglingId={togglingId}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmId(null)} aria-hidden />
          <div
            className="relative w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-[#111]">Точно удалить?</p>
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
                className="rounded px-3 py-1.5 text-sm text-[#111] hover:bg-gray-50"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}

      {pagesDraft.length === 0 && (
        <p className="py-8 text-center text-gray-500">Нет страниц. Выполните миграцию catalog_pages.</p>
      )}

      {isDirty && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={saveStatus === "saving"}
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text transition"
          >
            {saveStatus === "saving" ? "Сохранение…" : saveStatus === "saved" ? "Сохранено ✓" : "Сохранить порядок"}
          </button>
          <button
            type="button"
            onClick={() => setPagesDraft([...pagesFromServer])}
            className="rounded border border-outline-btn-border bg-white px-4 py-2 text-color-text-main hover:bg-outline-btn-hover-bg active:bg-outline-btn-active-bg transition"
          >
            Не сохранять
          </button>
        </div>
      )}
    </div>
  );
}
