"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SlidesGrid } from "@/components/admin/slides/SlidesGrid";
import type { Slide } from "@/components/admin/slides/SlideCard";

const RECOMMENDED_SIZE = "1920×900";
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/avif";

function areOrdersEqual(a: Slide[], b: Slide[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.id === b[i].id);
}

export default function AdminSlidesPage() {
  const [slidesFromServer, setSlidesFromServer] = useState<Slide[]>([]);
  const [slidesDraft, setSlidesDraft] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [editing, setEditing] = useState<Slide | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    file: null as File | null,
    is_active: true,
    sort_order: 0,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = !areOrdersEqual(slidesFromServer, slidesDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slides");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setSlidesFromServer(data);
      setSlidesDraft(data);
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
    setForm({ file: null, sort_order: 0, is_active: true });
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
    if (form.file) {
      const url = URL.createObjectURL(form.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (editing?.image_url) {
      setPreviewUrl(editing.image_url);
    } else if (creating) {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(null);
    }
  }, [form.file, editing?.image_url, creating]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function uploadFile(file: File, slideId?: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    if (slideId) formData.append("slideId", slideId);

    const res = await fetch("/api/admin/slides/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
    return data.image_url;
  }

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (creating) {
        if (!form.file) {
          setError("Выберите изображение");
          return;
        }
        setUploading(true);
        const image_url = await uploadFile(form.file);
        const res = await fetch("/api/admin/slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url,
            sort_order: slidesDraft.length,
            is_active: form.is_active,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        const newSlide = { ...data, sort_order: slidesDraft.length };
        setSlidesFromServer((s) => [...s, newSlide].sort((a, b) => a.sort_order - b.sort_order));
        setSlidesDraft((s) => [...s, newSlide].sort((a, b) => a.sort_order - b.sort_order));
        setCreating(false);
        setForm({ file: null, sort_order: slidesDraft.length, is_active: true });
      } else if (editing) {
        let image_url = editing.image_url;
        if (form.file) {
          setUploading(true);
          image_url = await uploadFile(form.file, editing.id);
        }
        const res = await fetch(`/api/admin/slides/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url,
            sort_order: form.sort_order,
            is_active: form.is_active,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка");
        const updated = { ...editing, image_url, sort_order: form.sort_order, is_active: form.is_active };
        setSlidesFromServer((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setSlidesDraft((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setEditing(null);
        setForm({ file: null, sort_order: 0, is_active: true });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить слайд?")) return;
    try {
      const res = await fetch(`/api/admin/slides/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      setSlidesFromServer((s) => s.filter((x) => x.id !== id));
      setSlidesDraft((s) => s.filter((x) => x.id !== id));
      setEditing(null);
    } catch (e) {
      setError(String(e));
    }
  }

  function handleReorder(newOrder: Slide[]) {
    setSlidesDraft(newOrder);
  }

  async function handleSaveOrder() {
    if (!isDirty) return;
    setSaveStatus("saving");
    setError("");
    try {
      const items = slidesDraft.map((s, i) => ({ id: s.id, sort_order: i }));
      const res = await fetch("/api/admin/slides/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ошибка сохранения");
      }
      const withOrder = slidesDraft.map((s, i) => ({ ...s, sort_order: i }));
      setSlidesFromServer(withOrder);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setError(String(e));
      setSaveStatus("idle");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setForm((prev) => ({ ...prev, file: f ?? null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) return <p className="text-[#111]">Загрузка…</p>;
  if (error && !creating && !editing) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111]">Слайды</h2>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({ file: null, sort_order: slidesDraft.length, is_active: true });
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
            className="relative w-full max-w-[720px] rounded-xl border border-[#2E7D32] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveForm}>
              <h3 className="mb-4 font-medium text-[#111]">
                {creating ? "Новый слайд" : "Редактирование"}
              </h3>
              {error && (creating || editing) && (
                <p className="mb-3 text-sm text-red-600">{error}</p>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#111]">Изображение</label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Рекомендуемый размер: {RECOMMENDED_SIZE} (16:9). JPEG, PNG, WebP, AVIF. До 15MB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={handleFileChange}
                    className="mt-2 block w-full text-sm text-[#111] file:mr-4 file:rounded file:border-0 file:bg-[#819570] file:px-4 file:py-2 file:text-white file:hover:bg-[#6f7f5f]"
                  />
                  {previewUrl && (
                    <div className="mt-3 relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      <Image
                        src={previewUrl}
                        alt="Превью"
                        fill
                        className="object-cover"
                        unoptimized={previewUrl.startsWith("blob:")}
                        sizes="(max-width: 768px) 100vw, 640px"
                      />
                    </div>
                  )}
                  {creating && !form.file && (
                    <p className="mt-2 text-sm text-amber-600">Для нового слайда необходимо выбрать изображение</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                    <span className="text-sm text-[#111]">Активен</span>
                  </label>
                  <div>
                    <label className="block text-sm text-[#111]">Порядок</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
                      }
                      className="mt-1 w-20 rounded border px-2 py-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={uploading || (creating && !form.file)}
                    className="rounded bg-[#819570] px-4 py-2 text-white hover:bg-[#6f7f5f] disabled:opacity-60"
                  >
                    {uploading ? "Загрузка…" : "Сохранить"}
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
                      onClick={() => handleDelete(editing.id)}
                      className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {slidesDraft.length > 0 && (
        <SlidesGrid
          slides={slidesDraft}
          onReorder={handleReorder}
          onEdit={(slide) => {
            setEditing(slide);
            setCreating(false);
            setForm({
              file: null,
              sort_order: slide.sort_order,
              is_active: slide.is_active,
            });
          }}
        />
      )}

      {slidesDraft.length === 0 && !creating && (
        <p className="py-8 text-center text-gray-500">Нет слайдов. Нажмите «Добавить».</p>
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
            onClick={() => {
              setSlidesDraft([...slidesFromServer]);
            }}
            className="rounded border border-[#819570] bg-white px-4 py-2 text-[#819570] hover:bg-[#819570]/5 transition"
          >
            Не сохранять
          </button>
        </div>
      )}
    </div>
  );
}
