"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Collection } from "@/components/admin/collections/CollectionCard";
import { CollectionsGrid } from "@/components/admin/collections/CollectionsGrid";
import { Modal } from "@/components/ui/modal";
import { parseAdminResponse } from "@/lib/adminFetch";

const RECOMMENDED_SIZE = "800×800";
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/avif";

type Category = { id: string; name: string; slug: string };

function areOrdersEqual(a: Collection[], b: Collection[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c.id === b[i].id);
}

export default function AdminHomeCollectionsPage() {
  const [collectionsFromServer, setCollectionsFromServer] = useState<Collection[]>([]);
  const [collectionsDraft, setCollectionsDraft] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [editing, setEditing] = useState<Collection | null>(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    file: null as File | null,
    name: "",
    category_slug: "magazin",
    is_active: true,
    sort_order: 0,
    description: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modalFormDirty, setModalFormDirty] = useState(false);
  const saveThenCloseRef = useRef(false);
  const resolveSaveRef = useRef<(() => void) | null>(null);
  const initialFormSnapshotRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const requestCloseRef = useRef<() => void>(() => {});

  const isDirty = !areOrdersEqual(collectionsFromServer, collectionsDraft);

  function formSnapshot(
    f: { name: string; category_slug: string; is_active: boolean; sort_order: number; description: string },
    hasFile: boolean
  ) {
    return JSON.stringify({
      name: f.name,
      category_slug: f.category_slug,
      is_active: f.is_active,
      sort_order: f.sort_order,
      description: f.description,
      fileSelected: hasFile,
    });
  }

  const isFormDirty =
    (creating || editing) &&
    initialFormSnapshotRef.current !== "" &&
    formSnapshot(form, !!form.file) !== initialFormSnapshotRef.current;

  useEffect(() => {
    setModalFormDirty(Boolean(isFormDirty));
  }, [isFormDirty]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [collectionsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/collections"),
        fetch("/api/admin/categories"),
      ]);
      const collectionsResult = await parseAdminResponse<Collection[]>(collectionsRes, {
        method: "GET",
        url: "/api/admin/collections",
      });
      if (!collectionsResult.ok || !Array.isArray(collectionsResult.data)) {
        const message = collectionsResult.message ?? "Ошибка загрузки коллекций";
        throw new Error(message);
      }
      const collectionsData = collectionsResult.data;
      setCollectionsFromServer(collectionsData);
      setCollectionsDraft(collectionsData);

      const categoriesResult = await parseAdminResponse<{ id: string; name: string; slug: string }[]>(categoriesRes, {
        method: "GET",
        url: "/api/admin/categories",
      });
      if (categoriesResult.ok && Array.isArray(categoriesResult.data)) {
        setCategories(
          categoriesResult.data.map((c) => ({
            id: String(c.id),
            name: c.name ?? "",
            slug: c.slug ?? "",
          }))
        );
      } else {
        if (!categoriesResult.ok) {
          console.error(categoriesResult.message ?? "Ошибка загрузки категорий");
        }
        setCategories([]);
      }
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
    setForm({ file: null, name: "", category_slug: "magazin", sort_order: 0, is_active: true, description: "" });
    initialFormSnapshotRef.current = "";
  }

  function resetModalFormToInitial() {
    try {
      const parsed = JSON.parse(initialFormSnapshotRef.current) as {
        name: string;
        category_slug: string;
        is_active: boolean;
        sort_order: number;
        description: string;
      };
      setForm((prev) => ({
        ...prev,
        name: parsed.name ?? "",
        category_slug: parsed.category_slug ?? "magazin",
        is_active: parsed.is_active ?? true,
        sort_order: parsed.sort_order ?? 0,
        description: parsed.description ?? "",
        file: null,
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (editing?.image_url) setPreviewUrl(editing.image_url);
      else setPreviewUrl(null);
    } catch {
      // ignore
    }
  }

  const modalWasOpenRef = useRef(false);
  useEffect(() => {
    const open = creating || editing;
    if (open && !modalWasOpenRef.current) {
      initialFormSnapshotRef.current = formSnapshot(form, !!form.file);
    }
    modalWasOpenRef.current = !!open;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot only when modal opens; full `form` would retrigger on every keystroke
  }, [creating, editing, form.name, form.category_slug, form.is_active, form.sort_order, form.description, form.file]);

  useEffect(() => {
    if (!creating && !editing) return;
    requestCloseRef.current = closeModal;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCloseConfirm) setShowCloseConfirm(false);
        else requestCloseRef.current();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [creating, editing, showCloseConfirm, closeModal]);

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

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function uploadFile(file: File, collectionId?: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    if (collectionId) formData.append("collectionId", collectionId);

    const url = "/api/admin/collections/upload";
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

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (creating) {
        if (!form.file) {
          setError("Выберите изображение");
          return;
        }
        if (!form.name.trim()) {
          setError("Введите название");
          return;
        }
        setUploading(true);
        const image_url = await uploadFile(form.file);
        const url = "/api/admin/collections";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url,
            name: form.name.trim(),
            category_slug: form.category_slug || "magazin",
            sort_order: collectionsDraft.length,
            is_active: form.is_active,
            description: form.description.trim() || null,
          }),
        });
        const result = await parseAdminResponse<Collection & { error?: string }>(res, {
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
        const newCol = { ...data, sort_order: collectionsDraft.length };
        setCollectionsFromServer((s) => [...s, newCol].sort((a, b) => a.sort_order - b.sort_order));
        setCollectionsDraft((s) => [...s, newCol].sort((a, b) => a.sort_order - b.sort_order));
        setCreating(false);
        setForm({
          file: null,
          name: "",
          category_slug: "magazin",
          sort_order: collectionsDraft.length,
          is_active: true,
          description: "",
        });
        if (saveThenCloseRef.current) {
          saveThenCloseRef.current = false;
          closeModal();
        }
      } else if (editing) {
        let image_url = editing.image_url;
        if (form.file) {
          setUploading(true);
          image_url = await uploadFile(form.file, editing.id);
        }
        const url = `/api/admin/collections/${editing.id}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url,
            name: form.name.trim() || editing.name,
            category_slug: form.category_slug || editing.category_slug,
            sort_order: form.sort_order,
            is_active: form.is_active,
            description: form.description.trim() || null,
          }),
        });
        const result = await parseAdminResponse<Collection & { error?: string }>(res, {
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
          name: form.name.trim() || editing.name,
          category_slug: form.category_slug || editing.category_slug,
          sort_order: form.sort_order,
          is_active: form.is_active,
          description: form.description.trim() || null,
        };
        setCollectionsFromServer((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setCollectionsDraft((s) => s.map((x) => (x.id === editing.id ? updated : x)));
        setEditing(null);
        setForm({ file: null, name: "", category_slug: "magazin", sort_order: 0, is_active: true, description: "" });
        if (saveThenCloseRef.current) {
          saveThenCloseRef.current = false;
          closeModal();
        }
      }
    } catch (e) {
      setError(String(e));
      saveThenCloseRef.current = false;
    } finally {
      setUploading(false);
      if (resolveSaveRef.current) {
        resolveSaveRef.current();
        resolveSaveRef.current = null;
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить коллекцию?")) return;
    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      setCollectionsFromServer((s) => s.filter((x) => x.id !== id));
      setCollectionsDraft((s) => s.filter((x) => x.id !== id));
      setEditing(null);
    } catch (e) {
      setError(String(e));
    }
  }

  function handleReorder(newOrder: Collection[]) {
    setCollectionsDraft(newOrder);
  }

  async function handleSaveOrder() {
    if (!isDirty) return;
    setSaveStatus("saving");
    setError("");
    try {
      const items = collectionsDraft.map((c, i) => ({ id: c.id, sort_order: i }));
      const url = "/api/admin/collections/reorder";
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
      const withOrder = collectionsDraft.map((c, i) => ({ ...c, sort_order: i }));
      setCollectionsFromServer(withOrder);
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
        <h2 className="text-xl font-semibold text-[#111]">Коллекции The Áme</h2>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({
              file: null,
              name: "",
              category_slug: "magazin",
              sort_order: collectionsDraft.length,
              is_active: true,
              description: "",
            });
          }}
          className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
        >
          Добавить
        </button>
      </div>

      <Modal
        isOpen={!!(creating || editing)}
        onClose={closeModal}
        title={creating ? "Новая коллекция" : "Редактирование"}
        unsavedChanges={modalFormDirty}
        onSaveAndClose={() =>
          new Promise<void>((resolve) => {
            resolveSaveRef.current = resolve;
            saveThenCloseRef.current = true;
            const formEl = document.getElementById("collections-modal-form") as HTMLFormElement | null;
            if (formEl) formEl.requestSubmit();
          })
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              form="collections-modal-form"
              disabled={uploading || (creating && (!form.file || !form.name.trim()))}
              className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
            >
              {uploading ? "Загрузка…" : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={resetModalFormToInitial}
              disabled={!modalFormDirty || uploading}
              className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отменить изменения
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
        }
      >
        <form id="collections-modal-form" onSubmit={handleSaveForm} className="space-y-3">
              {error && (creating || editing) && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#111]">Изображение</label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Рекомендуемый размер: {RECOMMENDED_SIZE}. JPEG, PNG, WebP, AVIF. До 15MB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={handleFileChange}
                    className="mt-2 block w-full text-sm text-[#111] file:mr-4 file:rounded file:border-0 file:bg-accent-btn file:px-4 file:py-2 file:text-white file:hover:bg-accent-btn-hover"
                  />
                  {previewUrl && (
                    <div className="mt-3 relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      <Image
                        src={previewUrl}
                        alt="Превью"
                        fill
                        className="object-cover"
                        unoptimized={previewUrl.startsWith("blob:")}
                        sizes="200px"
                      />
                    </div>
                  )}
                  {creating && !form.file && (
                    <p className="mt-2 text-sm text-amber-600">Для новой коллекции необходимо выбрать изображение</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111]">Название</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Например: Корзины цветов"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111]">Категория</label>
                  <select
                    value={form.category_slug}
                    onChange={(e) => setForm((f) => ({ ...f, category_slug: e.target.value }))}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-[#111]"
                  >
                    {!categories.some((c) => c.slug === "magazin") && (
                      <option value="magazin">Каталог (вся витрина)</option>
                    )}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {form.category_slug === "magazin" || !form.category_slug
                      ? "Карточка поведёт на главную каталога /magazin"
                      : `Карточка поведёт в /magazine/${form.category_slug}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111]">Описание</label>
                  <p className="mt-0.5 text-xs text-gray-500 mb-1">
                    Показывается под заголовком секции на главной (берётся из первой активной коллекции по порядку)
                  </p>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Введите описание коллекции..."
                    className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                    <span className="text-sm text-[#111]">Активна</span>
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
              </div>
            </form>
      </Modal>

      {collectionsDraft.length > 0 && (
        <CollectionsGrid
          collections={collectionsDraft}
          onReorder={handleReorder}
          onEdit={(col) => {
            setEditing(col);
            setCreating(false);
            setForm({
              file: null,
              name: col.name,
              category_slug: col.category_slug || "magazin",
              sort_order: col.sort_order,
              is_active: col.is_active,
              description: col.description || "",
            });
          }}
        />
      )}

      {collectionsDraft.length === 0 && !creating && (
        <p className="py-8 text-center text-gray-500">Нет коллекций. Нажмите «Добавить».</p>
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
            onClick={() => setCollectionsDraft([...collectionsFromServer])}
            className="rounded border border-outline-btn-border bg-white px-4 py-2 text-color-text-main hover:bg-outline-btn-hover-bg active:bg-outline-btn-active-bg transition"
          >
            Не сохранять
          </button>
        </div>
      )}
    </div>
  );
}
