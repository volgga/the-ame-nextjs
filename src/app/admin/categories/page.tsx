"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/components/admin/categories/CategoryCard";
import { slugify } from "@/utils/slugify";
import { normalizeFlowerKey } from "@/lib/normalizeFlowerKey";
import type { FlowerSection } from "@/lib/categories";

const CategoriesGrid = dynamic(
  () => import("@/components/admin/categories/CategoriesGrid").then((m) => ({ default: m.CategoriesGrid })),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[100px] animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    ),
  }
);

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
  const [form, setForm] = useState({ name: "", slug: "", is_active: true, description: "", seo_title: "", flower_sections: [] as FlowerSection[] });
  
  // Убеждаемся, что flower_sections всегда массив
  const flowerSections = Array.isArray(form.flower_sections) ? form.flower_sections : [];
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [availableFlowers, setAvailableFlowers] = useState<{ key: string; label: string }[]>([]);
  const [showFlowerPicker, setShowFlowerPicker] = useState(false);
  
  // Безопасные массивы для использования в рендере
  const safeAvailableFlowers = Array.isArray(availableFlowers) ? availableFlowers : [];

  const isDirty = !areOrdersEqual(categoriesFromServer, categoriesDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      // Убеждаемся, что данные - массив и обрабатываем flower_sections
      const safeData = Array.isArray(data)
        ? data.map((cat: any) => ({
            ...cat,
            flower_sections: Array.isArray(cat.flower_sections) ? cat.flower_sections : null,
          }))
        : [];
      setCategoriesFromServer(safeData);
      setCategoriesDraft(safeData);
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
    setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "", flower_sections: [] });
    setIsSlugManuallyEdited(false);
    setShowFlowerPicker(false);
  }

  // Загрузка доступных цветов при открытии редактирования категории "Цветы в составе"
  useEffect(() => {
    if (!editing || editing.slug !== "cvety-v-sostave") {
      setAvailableFlowers([]);
      return;
    }
    fetch("/api/admin/flowers")
      .then((res) => (res.ok ? res.json() : []))
      .then((flowers: unknown) => {
        const flowersArray = Array.isArray(flowers) ? flowers.filter((f): f is string => typeof f === "string") : [];
        setAvailableFlowers(flowersArray.map((f) => ({ key: normalizeFlowerKey(f), label: f })));
      })
      .catch(() => setAvailableFlowers([]));
  }, [editing]);

  // Загрузка flower_sections при открытии редактирования
  useEffect(() => {
    if (editing) {
      const flowerSectionsFromEditing = (editing as any).flower_sections;
      setForm({
        name: editing.name,
        slug: editing.slug,
        is_active: editing.is_active,
        description: editing.description ?? "",
        seo_title: editing.seo_title ?? "",
        flower_sections: Array.isArray(flowerSectionsFromEditing) ? flowerSectionsFromEditing : [],
      });
    }
  }, [editing]);

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
    const nameTrimmed = form.name.trim();
    const slugTrimmed = form.slug.trim();
    if (!nameTrimmed) {
      setError("Название категории обязательно.");
      return;
    }
    if (!slugTrimmed) {
      setError("Slug обязателен. Заполните slug или измените название.");
      return;
    }
    try {
      if (creating) {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            slug: slugTrimmed,
            is_active: form.is_active,
            description: form.description.trim() || null,
            seo_title: form.seo_title.trim() || null,
            flower_sections: form.slug === "cvety-v-sostave" && flowerSections.length > 0 ? flowerSections : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        const newCat = { ...data, sort_order: categoriesDraft.length };
        setCategoriesFromServer((s) => [...s, newCat].sort((a, b) => a.sort_order - b.sort_order));
        setCategoriesDraft((s) => [...s, newCat].sort((a, b) => a.sort_order - b.sort_order));
        setCreating(false);
        setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "", flower_sections: [] });
        setIsSlugManuallyEdited(false);
      } else if (editing) {
        const res = await fetch(`/api/admin/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            slug: slugTrimmed,
            is_active: form.is_active,
            description: form.description.trim() || null,
            seo_title: form.seo_title.trim() || null,
            flower_sections: (editing.slug === "cvety-v-sostave" || slugTrimmed === "cvety-v-sostave") && flowerSections.length > 0 ? flowerSections : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        const flowerSectionsFromData = (data as any).flower_sections;
        const updated = {
          ...editing,
          name: data.name,
          slug: data.slug ?? editing.slug,
          is_active: data.is_active,
          description: data.description ?? null,
          seo_title: data.seo_title ?? null,
          flower_sections: Array.isArray(flowerSectionsFromData) ? flowerSectionsFromData : null,
        };
        setCategoriesFromServer((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setCategoriesDraft((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setEditing(null);
        setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "", flower_sections: [] });
        setIsSlugManuallyEdited(false);
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
            setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
            setIsSlugManuallyEdited(false);
          }}
          className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
        >
          Добавить
        </button>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} aria-hidden />
          <div
            className="relative w-full max-w-[480px] max-h-[90vh] flex flex-col rounded-xl border border-border-block bg-white hover:border-border-block-hover shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveForm} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <h3 className="mb-4 font-medium text-[#111]">{creating ? "Новая категория" : "Редактирование"}</h3>
                {error && (creating || editing) && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Название категории</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setForm((f) => ({
                          ...f,
                          name,
                          ...(isSlugManuallyEdited ? {} : { slug: slugify(name) }),
                        }));
                      }}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111]">Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, slug: e.target.value }));
                        setIsSlugManuallyEdited(true);
                      }}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111] font-mono text-sm"
                      placeholder="vazy"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Автоматически из названия. Если измените вручную — дальнейшее изменение названия не перезапишет slug.
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
                    <label className="block text-sm font-medium text-[#111]">SEO заголовок (title)</label>
                    <input
                      type="text"
                      value={form.seo_title}
                      onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                      className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                      placeholder="Например: Купить букеты на День влюбленных"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Если заполнено — используется в &lt;title&gt; страницы категории вместо автогенерации.
                    </p>
                  </div>
                  {/* Секция подразделов по цветам (только для категории "Цветы в составе") */}
                  {(form.slug === "cvety-v-sostave" || editing?.slug === "cvety-v-sostave") && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-[#111]">Подразделы (цветы)</label>
                        {safeAvailableFlowers.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowFlowerPicker(!showFlowerPicker)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Добавить цветок
                          </button>
                        )}
                      </div>
                      {showFlowerPicker && (
                        <div className="mb-3 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
                          {safeAvailableFlowers
                            .filter((f) => !flowerSections.some((s) => s.key === f.key))
                            .map((flower) => (
                              <button
                                key={flower.key}
                                type="button"
                                onClick={() => {
                                  setForm((f) => ({
                                    ...f,
                                    flower_sections: [
                                      ...(Array.isArray(f.flower_sections) ? f.flower_sections : []),
                                      { key: flower.key, title: flower.label, description: "" },
                                    ],
                                  }));
                                  setShowFlowerPicker(false);
                                }}
                                className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                              >
                                {flower.label}
                              </button>
                            ))}
                        </div>
                      )}
                      {flowerSections.length > 0 ? (
                        <div className="space-y-2">
                          {flowerSections.map((section, idx) => (
                            <div key={section.key} className="border border-gray-200 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-[#111]">{section.title}</span>
                                <button
                                  type="button"
                                onClick={() => {
                                  setForm((f) => ({
                                    ...f,
                                    flower_sections: (Array.isArray(f.flower_sections) ? f.flower_sections : []).filter((_, i) => i !== idx),
                                  }));
                                }}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Удалить
                                </button>
                              </div>
                              <input
                                type="text"
                                value={section.title}
                                onChange={(e) => {
                                  const current = Array.isArray(form.flower_sections) ? form.flower_sections : [];
                                  const updated = [...current];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setForm((f) => ({ ...f, flower_sections: updated }));
                                }}
                                placeholder="Заголовок"
                                className="w-full mb-2 rounded border border-gray-300 px-2 py-1 text-sm text-[#111]"
                              />
                              <textarea
                                value={section.description}
                                onChange={(e) => {
                                  const current = Array.isArray(form.flower_sections) ? form.flower_sections : [];
                                  const updated = [...current];
                                  updated[idx] = { ...updated[idx], description: e.target.value };
                                  setForm((f) => ({ ...f, flower_sections: updated }));
                                }}
                                placeholder="Описание"
                                rows={2}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-[#111]"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Нет подразделов. Нажмите "Добавить цветок" для добавления.</p>
                      )}
                    </div>
                  )}
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
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmId(editing.id);
                      setEditing(null);
                      setForm({ name: "", slug: "", is_active: true, description: "", seo_title: "" });
                      setIsSlugManuallyEdited(false);
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
setForm({
            name: cat.name,
            slug: cat.slug ?? slugify(cat.name),
            is_active: cat.is_active,
            description: cat.description ?? "",
            seo_title: cat.seo_title ?? "",
          });
            setIsSlugManuallyEdited(false);
          }}
          onToggleActive={handleToggleActive}
          onDeleteClick={(cat) => setDeleteConfirmId(cat.id)}
          togglingId={togglingId}
        />
      )}

      {/* Мини-модалка подтверждения удаления */}
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

      {categoriesDraft.length === 0 && !creating && (
        <p className="py-8 text-center text-gray-500">Нет категорий. Нажмите «Добавить».</p>
      )}

      {isDirty && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={saveStatus === "saving"}
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text transition"
          >
            {saveStatus === "saving" ? "Сохранение…" : saveStatus === "saved" ? "Сохранено ✓" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={() => setCategoriesDraft([...categoriesFromServer])}
            className="rounded border border-outline-btn-border bg-white px-4 py-2 text-color-text-main hover:bg-outline-btn-hover-bg active:bg-outline-btn-active-bg transition"
          >
            Не сохранять
          </button>
        </div>
      )}
    </div>
  );
}
