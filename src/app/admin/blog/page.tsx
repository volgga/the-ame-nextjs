"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import type { AdminBlogPost } from "@/components/admin/blog/BlogPostRow";
import { BlogPostRow } from "@/components/admin/blog/BlogPostRow";

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      await load();
      setDeleteConfirmId(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleReorder(newOrder: AdminBlogPost[]) {
    setReordering(true);
    try {
      const items = newOrder.map((post, index) => ({
        id: post.id,
        sort_order: index,
      }));

      const res = await fetch("/api/admin/blog/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ошибка сохранения порядка");
      }

      setPosts(newOrder);
    } catch (e) {
      setError(String(e));
      await load(); // Перезагружаем исходный порядок при ошибке
    } finally {
      setReordering(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = posts.findIndex((p) => p.id === active.id);
    const newIndex = posts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(posts, oldIndex, newIndex);
    const withOrder = reordered.map((p, i) => ({ ...p, sort_order: i }));
    handleReorder(withOrder);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Блог</h1>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Блог</h1>
        <Link
          href="/admin/blog/new"
          className="px-4 py-2 bg-color-bg-main text-white rounded-lg hover:bg-color-accent-btn-hover transition-colors"
        >
          Создать пост
        </Link>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Постов пока нет. Создайте первый пост.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Обложка</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Заголовок</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Статус</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Дата</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Действия</th>
                  </tr>
                </thead>
                <SortableContext items={posts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-gray-100">
                    {posts.map((post) => (
                      <BlogPostRow
                        key={post.id}
                        post={post}
                        onEdit={() => router.push(`/admin/blog/${post.id}`)}
                        onDelete={() => setDeleteConfirmId(post.id)}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </div>
        </DndContext>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Удалить пост?</h3>
            <p className="text-gray-600 mb-6">Это действие нельзя отменить. Пост будет удалён навсегда.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
