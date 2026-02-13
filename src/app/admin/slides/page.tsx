"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { Slide } from "@/components/admin/slides/SlideCard";
import { parseAdminResponse } from "@/lib/adminFetch";

const SlidesGrid = dynamic(
  () => import("@/components/admin/slides/SlidesGrid").then((m) => ({ default: m.SlidesGrid })),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-video animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    ),
  }
);

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
    button_text: "",
    button_href: "",
    button_variant: "filled" as "filled" | "transparent",
    button_align: "center" as "left" | "center" | "right",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = !areOrdersEqual(slidesFromServer, slidesDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = "/api/admin/slides";
      const res = await fetch(url);
      const result = await parseAdminResponse<Slide[]>(res, { method: "GET", url });
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
      setSlidesFromServer(result.data);
      setSlidesDraft(result.data);
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
    setMounted(true);
  }, []);

  // Блокировка скролла при открытой модалке
  useEffect(() => {
    if (creating || editing) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [creating, editing]);

  function closeModal() {
    setCreating(false);
    setEditing(null);
    setForm({
      file: null,
      sort_order: 0,
      is_active: true,
      button_text: "",
      button_href: "",
      button_variant: "filled",
      button_align: "center",
    });
  }

  function setFormFromSlide(slide: Slide) {
    setForm({
      file: null,
      sort_order: slide.sort_order,
      is_active: slide.is_active,
      button_text: slide.button_text ?? "",
      button_href: slide.button_href ?? "",
      button_variant: slide.button_variant === "transparent" ? "transparent" : "filled",
      button_align:
        slide.button_align === "left" || slide.button_align === "center" || slide.button_align === "right"
          ? slide.button_align
          : "center",
    });
  }

  const anyModalOpen = creating || !!editing;
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

    const url = "/api/admin/slides/upload";
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });
    const result = await parseAdminResponse<{ error?: string; image_url?: string }>(res, {
      method: "POST",
      url,
    });
    if (!result.ok) {
      const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
      const message = apiError
        ? `${apiError}${result.message ? ` (${result.message})` : ""}`
        : result.message ?? "Ошибка загрузки";
      throw new Error(message);
    }
    if (!result.data?.image_url) {
      throw new Error(result.message ?? "Ответ сервера не содержит image_url");
    }
    return result.data.image_url;
  }

  function getButtonPayload() {
    const hasText = Boolean(form.button_text?.trim());
    const hasHref = Boolean(form.button_href?.trim());
    if (!hasText && !hasHref) {
      return { button_text: null, button_href: null, button_variant: null, button_align: null };
    }
    if (hasText && !hasHref) {
      return null;
    }
    if (!hasText && hasHref) {
      return null;
    }
    return {
      button_text: form.button_text.trim(),
      button_href: form.button_href.trim(),
      button_variant: form.button_variant,
      button_align: form.button_align,
    };
  }

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const buttonPayload = getButtonPayload();
    if (buttonPayload === null) {
      setError("Для кнопки нужно указать и текст, и ссылку (или оба оставить пустыми)");
      return;
    }
    try {
      if (creating) {
        if (!form.file) {
          setError("Выберите изображение");
          return;
        }
        setUploading(true);
        const image_url = await uploadFile(form.file);
        const url = "/api/admin/slides";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url,
            sort_order: slidesDraft.length,
            is_active: form.is_active,
            ...buttonPayload,
          }),
        });
        const result = await parseAdminResponse<Slide & { error?: string }>(res, {
          method: "POST",
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
        const newSlide = { ...data, sort_order: slidesDraft.length };
        setSlidesFromServer((s) => [...s, newSlide].sort((a, b) => a.sort_order - b.sort_order));
        setSlidesDraft((s) => [...s, newSlide].sort((a, b) => a.sort_order - b.sort_order));
        setCreating(false);
        setForm({
          file: null,
          sort_order: slidesDraft.length,
          is_active: true,
          button_text: "",
          button_href: "",
          button_variant: "filled",
          button_align: "center",
        });
      } else if (editing) {
        let image_url = editing.image_url;
        if (form.file) {
          setUploading(true);
          image_url = await uploadFile(form.file, editing.id);
        }
        const url = `/api/admin/slides/${editing.id}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url,
            sort_order: form.sort_order,
            is_active: form.is_active,
            ...buttonPayload,
          }),
        });
        const result = await parseAdminResponse<Slide & { error?: string }>(res, {
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
        const updated = {
          ...editing,
          image_url,
          sort_order: form.sort_order,
          is_active: form.is_active,
          ...buttonPayload,
        };
        setSlidesFromServer((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setSlidesDraft((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setEditing(null);
        setForm({
          file: null,
          sort_order: 0,
          is_active: true,
          button_text: "",
          button_href: "",
          button_variant: "filled",
          button_align: "center",
        });
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
      const url = "/api/admin/slides/reorder";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = await parseAdminResponse<{ error?: string }>(res, { method: "POST", url });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка сохранения";
        throw new Error(message);
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
            <div key={i} className="aspect-video animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111]">Слайды</h2>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({
              file: null,
              sort_order: slidesDraft.length,
              is_active: true,
              button_text: "",
              button_href: "",
              button_variant: "filled",
              button_align: "center",
            });
          }}
          className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
        >
          Добавить
        </button>
      </div>

      {mounted &&
        (creating || editing) &&
        createPortal(
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} aria-hidden />
            <div
              className="relative w-full max-w-[720px] max-h-[85vh] flex flex-col overflow-hidden rounded-xl border border-border-block bg-white shadow-xl hover:border-border-block-hover"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <form onSubmit={handleSaveForm} className="space-y-3">
                  <h3 className="mb-4 font-medium text-[#111]">{creating ? "Новый слайд" : "Редактирование"}</h3>
                  {error && (creating || editing) && <p className="mb-3 text-sm text-red-600">{error}</p>}
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
                        className="mt-2 block w-full text-sm text-[#111] file:mr-4 file:rounded file:border-0 file:bg-accent-btn file:px-4 file:py-2 file:text-white file:hover:bg-accent-btn-hover"
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
                          onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                          className="mt-1 w-20 rounded border px-2 py-1"
                        />
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-[#111] mb-3">Кнопка на слайде</h4>
                      <p className="text-xs text-gray-500 mb-3">
                        Заполните текст и ссылку — кнопка появится на слайде. Оставьте оба пустыми — кнопки не будет.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-[#111]">Текст кнопки</label>
                          <input
                            type="text"
                            value={form.button_text}
                            onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))}
                            placeholder="Например: В каталог"
                            className="mt-1 w-full rounded border px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-[#111]">Ссылка</label>
                          <input
                            type="text"
                            value={form.button_href}
                            onChange={(e) => setForm((f) => ({ ...f, button_href: e.target.value }))}
                            placeholder="/catalog или https://..."
                            className="mt-1 w-full rounded border px-3 py-2"
                          />
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <label className="block text-sm text-[#111]">Вид</label>
                            <select
                              value={form.button_variant}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, button_variant: e.target.value as "filled" | "transparent" }))
                              }
                              className="mt-1 rounded border px-3 py-2"
                            >
                              <option value="filled">Залитая</option>
                              <option value="transparent">Прозрачная с обводкой</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-[#111]">Положение</label>
                            <select
                              value={form.button_align}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, button_align: e.target.value as "left" | "center" | "right" }))
                              }
                              className="mt-1 rounded border px-3 py-2"
                            >
                              <option value="left">Слева</option>
                              <option value="center">По центру</option>
                              <option value="right">Справа</option>
                            </select>
                          </div>
                        </div>
                        {(form.button_text || form.button_href) && (
                          <button
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                button_text: "",
                                button_href: "",
                                button_variant: "filled",
                                button_align: "center",
                              }))
                            }
                            className="text-sm text-red-600 hover:underline"
                          >
                            Удалить кнопку
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={uploading || (creating && !form.file)}
                        className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
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
          </div>,
          document.body
        )}

      {slidesDraft.length > 0 && (
        <SlidesGrid
          slides={slidesDraft}
          onReorder={handleReorder}
          onEdit={(slide) => {
            setEditing(slide);
            setCreating(false);
            setFormFromSlide(slide);
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
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text transition"
          >
            {saveStatus === "saving" ? "Сохранение…" : saveStatus === "saved" ? "Сохранено ✓" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSlidesDraft([...slidesFromServer]);
            }}
            className="rounded border border-outline-btn-border bg-white px-4 py-2 text-color-text-main hover:bg-outline-btn-hover-bg active:bg-outline-btn-active-bg transition"
          >
            Не сохранять
          </button>
        </div>
      )}
    </div>
  );
}
