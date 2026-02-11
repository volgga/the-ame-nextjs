"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { parseAdminResponse } from "@/lib/adminFetch";

/** Категория из таблицы categories (единственный источник для селекта «Добавить категорию»). */
type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

function hasValidSlug(c: CategoryOption): boolean {
  return typeof c.slug === "string" && c.slug.trim() !== "";
}

type AddOnItem = {
  slug: string;
  name: string;
};

function SortableAddOnRow({ item, onRemove }: { item: AddOnItem; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.slug,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl border border-border-block bg-white p-3 ${
        isDragging ? "opacity-80 shadow-md" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-gray-500 hover:bg-gray-100 active:cursor-grabbing"
        aria-label="Перетащить"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="flex-1 font-medium text-[#111]">{item.name}</span>
      <span className="text-sm text-gray-500">{item.slug}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        aria-label="Удалить из списка"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminAddOnProductsPage() {
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [items, setItems] = useState<AddOnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [addSlug, setAddSlug] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catRes, orderRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/add-on-products"),
      ]);
      if (!catRes.ok) throw new Error("Ошибка загрузки категорий");
      if (!orderRes.ok) throw new Error("Ошибка загрузки настроек");
      const catResult = await parseAdminResponse<CategoryOption[]>(catRes, {
        method: "GET",
        url: "/api/admin/categories",
      });
      const orderResult = await parseAdminResponse<{ categorySlugs: string[] }>(orderRes, {
        method: "GET",
        url: "/api/admin/add-on-products",
      });
      if (!catResult.ok || !Array.isArray(catResult.data)) {
        const apiError =
          catResult.data && !Array.isArray(catResult.data) && typeof (catResult.data as any).error === "string"
            ? (catResult.data as any).error
            : null;
        const message = apiError
          ? `${apiError}${catResult.message ? ` (${catResult.message})` : ""}`
          : catResult.message ?? "Ошибка загрузки категорий";
        throw new Error(message);
      }
      if (!orderResult.ok || !orderResult.data || !Array.isArray(orderResult.data.categorySlugs)) {
        const apiError =
          orderResult.data && typeof (orderResult.data as any).error === "string"
            ? (orderResult.data as any).error
            : null;
        const message = apiError
          ? `${apiError}${orderResult.message ? ` (${orderResult.message})` : ""}`
          : orderResult.message ?? "Ошибка загрузки настроек";
        throw new Error(message);
      }
      const rawCategories = catResult.data;
      const { categorySlugs } = orderResult.data;
      const categories = rawCategories.filter(hasValidSlug);
      setAllCategories(categories);
      const validSlugs = new Set(categories.map((c) => c.slug));
      const slugToName = new Map(categories.map((c) => [c.slug, c.name]));
      const ordered = categorySlugs
        .filter((slug) => validSlugs.has(slug))
        .map((slug) => ({
          slug,
          name: slugToName.get(slug) ?? slug,
        }));
      setItems(ordered);
      setAddSlug("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.slug === active.id);
    const newIndex = items.findIndex((i) => i.slug === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setItems(arrayMove(items, oldIndex, newIndex));
  }

  const availableToAdd = allCategories.filter((c) => hasValidSlug(c) && !items.some((i) => i.slug === c.slug));

  function handleAdd() {
    if (!addSlug) return;
    const cat = allCategories.find((c) => c.slug === addSlug);
    if (cat) {
      setItems((prev) => [...prev, { slug: cat.slug, name: cat.name }]);
      setAddSlug("");
    }
  }

  function handleRemove(slug: string) {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }

  async function handleSave() {
    setSaveStatus("saving");
    setError("");
    try {
      const url = "/api/admin/add-on-products";
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorySlugs: items.map((i) => i.slug) }),
      });
      const result = await parseAdminResponse<{ error?: string }>(res, {
        method: "PATCH",
        url,
      });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка сохранения";
        throw new Error(message);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setError(String(e));
      setSaveStatus("idle");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-[#111]">Доп товары</h2>
        <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#111]">Доп товары</h2>
      <p className="text-sm text-gray-600">
        Категории и их порядок в блоке «Хотите добавить к заказу?» на карточке товара. Товары выводятся по одному из
        каждой категории в заданном порядке, затем цикл повторяется.
      </p>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={addSlug}
          onChange={(e) => setAddSlug(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-[#111] min-w-[200px]"
          aria-label="Добавить категорию из таблицы categories"
        >
          <option value="">Добавить категорию</option>
          {availableToAdd.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name} ({c.slug})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!addSlug}
          className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Добавить
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[#111]">Порядок категорий (сверху вниз)</h3>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Нет категорий. Добавьте категории выше — по умолчанию используются Сладости, Вазы, Шары, Игрушки.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.slug)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <SortableAddOnRow key={item.slug} item={item} onRemove={() => handleRemove(item.slug)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? "Сохранение…" : saveStatus === "saved" ? "Сохранено ✓" : "Сохранить порядок"}
          </button>
        </div>
      )}
    </div>
  );
}
