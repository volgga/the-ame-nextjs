"use client";

import { useCallback, useEffect, useState } from "react";
import { CategoriesGrid } from "@/components/admin/categories/CategoriesGrid";
import type { Category } from "@/components/admin/categories/CategoryCard";

function areOrdersEqual(a: Category[], b: Category[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c.id === b[i].id);
}

export default function AdminCategoriesPage() {
  const [categoriesFromServer, setCategoriesFromServer] = useState<Category[]>([]);
  const [categoriesDraft, setCategoriesDraft] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", is_active: true, description: "" });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isDirty = !areOrdersEqual(categoriesFromServer, categoriesDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setCategoriesFromServer(data);
      setCategoriesDraft(data);
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
    setForm({ name: "", is_active: true, description: "" });
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
    setError("");
    try {
      if (creating) {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            is_active: form.is_active,
            description: form.description.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        const newCat = { ...data, sort_order: categoriesDraft.length };
        setCategoriesFromServer((s) => [...s, newCat].sort((a, b) => a.sort_order - b.sort_order));
        setCategoriesDraft((s) => [...s, newCat].sort((a, b) => a.sort_order - b.sort_order));
        setCreating(false);
        setForm({ name: "", is_active: true, description: "" });
      } else if (editing) {
        const res = await fetch(`/api/admin/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            is_active: form.is_active,
            description: form.description.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        const updated = { ...editing, name: data.name, is_active: data.is_active, description: data.description ?? null };
        setCategoriesFromServer((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setCategoriesDraft((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setEditing(null);
        setForm({ name: "", is_active: true, description: "" });
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleToggleActive(cat: Category) {
    setTogglingId(cat.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      const updated = { ...cat, is_active: data.is_active };
      setCategoriesFromServer((s) => s.map((x) => (x.id === cat.id ? updated : x)));
      setCategoriesDraft((s) => s.map((x) => (x.id === cat.id ? updated : x)));
    } catch (e) {
      setError(String(e));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      const nextDraft = categoriesDraft.filter((x) => x.id !== id);
      const withOrder = nextDraft.map((c, i) => ({ ...c, sort_order: i }));
      setCategoriesFromServer(withOrder);
      setCategoriesDraft(withOrder);
      setEditing(null);
      if (withOrder.length > 0) {
        const reorderRes = await fetch("/api/admin/categories/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: withOrder.map((c, i) => ({ id: c.id, sort_order: i })),
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

  function handleReorder(newOrder: Category[]) {
    setCategoriesDraft(newOrder);
  }

  async function handleSaveOrder() {
    if (!isDirty) return;
    setSaveStatus("saving");
    setError("");
    try {
      const items = categoriesDraft.map((c, i) => ({ id: c.id, sort_order: i }));
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ошибка сохранения");
      }
      const withOrder = categoriesDraft.map((c, i) => ({ ...c, sort_order: i }));
      setCategoriesFromServer(withOrder);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setError(String(e));
      setSaveStatus("idle");
    }
  }

  if (error && !creating && !editing) return <p className="text-red-600">{error}</p>;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-28 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[100px] animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111]">Категории</h2>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({ name: "", is_active: true, description: "" });
          }}
          className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f]"
        >
          Добавить
        </button>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
            aria-hidden
          />
          <div
            className="relative w-full max-w-[480px] max-h-[90vh] flex flex-col rounded-xl border border-[#2E7D32] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveForm} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <h3 className="mb-4 font-medium text-[#111]">
                  {creating ? "Новая категория" : "Редактирование"}
                </h3>
                {error && (creating || editing) && (
                  <p className="mb-3 text-sm text-red-600">{error}</p>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название категории</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      required
                      autoFocus
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Slug формируется автоматически и не показывается.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Текст</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={8}
                      className="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-[#111] text-sm min-h-[120px]"
                      placeholder="SEO/описательный текст категории (отображается на странице категории)"
                      maxLength={5000}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {form.description.length}/5000 символов. Необязательно.
                    </p>
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
                    className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f]"
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
                        setEditing(null);
                        setForm({ name: "", is_active: true, description: "" });
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

      {categoriesDraft.length > 0 && (
        <CategoriesGrid
          categories={categoriesDraft}
          onReorder={handleReorder}
          onEdit={(cat) => {
            setEditing(cat);
            setCreating(false);
            setForm({ name: cat.name, is_active: cat.is_active, description: cat.description ?? "" });
          }}
          onToggleActive={handleToggleActive}
          onDeleteClick={(cat) => setDeleteConfirmId(cat.id)}
          togglingId={togglingId}
        />
      )}

      {/* Мини-модалка подтверждения удаления */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setDeleteConfirmId(null)}
            aria-hidden
          />
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

      {categoriesDraft.length === 0 && !creating && (
        <p className="py-8 text-center text-gray-500">Нет категорий. Нажмите «Добавить».</p>
      )}

      {isDirty && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={saveStatus === "saving"}
            className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f] disabled:opacity-60 transition"
          >
            {saveStatus === "saving" ? "Сохранение…" : saveStatus === "saved" ? "Сохранено ✓" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={() => setCategoriesDraft([...categoriesFromServer])}
            className="rounded border border-[#819570] bg-white px-4 py-2 text-[#819570] hover:bg-[#819570]/5 transition"
          >
            Не сохранять
          </button>
        </div>
      )}
    </div>
  );
}
