"use client";

import { useCallback, useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, GripVertical, ChevronRight } from "lucide-react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: "1",
    question: "Как быстро осуществляется доставка цветов по Сочи?",
    answer:
      "Доставка цветов по Сочи осуществляется ежедневно. Вы можете оформить заказ заранее или в день доставки, выбрав удобное время. Минимальное время доставки — от 45 минут.",
  },
  {
    id: "2",
    question: "В какие районы Сочи вы доставляете?",
    answer:
      "Мы доставляем цветы во все основные районы города Сочи. При оформлении заказа вы можете указать точный адрес, и мы подтвердим возможность доставки.",
  },
  {
    id: "3",
    question: "Как оплатить заказ?",
    answer:
      "Мы принимаем различные способы оплаты: наличными при получении, банковской картой онлайн или при получении. Все способы оплаты доступны при оформлении заказа.",
  },
  {
    id: "4",
    question: "Насколько свежие цветы вы используете?",
    answer:
      "Мы работаем только со свежими цветами и создаём букеты, которые сохраняют свежесть как можно дольше. Качество контролируется на всех этапах — от сборки до передачи получателю.",
  },
  {
    id: "5",
    question: "Можно ли добавить открытку к букету?",
    answer:
      "Да, вы можете добавить открытку с личным текстом при оформлении заказа. Мы передадим её вместе с букетом получателю.",
  },
  {
    id: "6",
    question: "Что делать, если цветы не подошли?",
    answer:
      "Если у вас возникли вопросы по качеству или составу букета, пожалуйста, свяжитесь с нами. Мы всегда готовы помочь и решить любую ситуацию.",
  },
  {
    id: "7",
    question: "Можно ли заказать букет заранее?",
    answer:
      "Да, вы можете оформить заказ заранее, выбрав удобную дату и время доставки. Это особенно удобно для важных событий и праздников.",
  },
  {
    id: "8",
    question: "Какие виды букетов вы предлагаете?",
    answer:
      "В нашем каталоге представлены классические и авторские композиции, букеты из роз, монобукеты, цветы в коробке и цветы в корзине. Мы регулярно обновляем ассортимент, следуя современным тенденциям флористики.",
  },
];

function itemsSnapshot(list: FaqItem[]): string {
  return JSON.stringify(list.map((i) => ({ id: i.id, question: i.question, answer: i.answer })));
}

export type FaqFormRef = {
  save: () => Promise<void>;
  resetToInitial: () => void;
};

type FaqFormProps = {
  onDirtyChange?: (dirty: boolean) => void;
  formRef?: React.RefObject<FaqFormRef | null>;
};

/**
 * FaqForm — форма редактирования FAQ в модалке. Аккордеон + перетаскивание за handle.
 */
export const FaqForm = forwardRef<FaqFormRef, FaqFormProps>(function FaqForm(
  { onDirtyChange, formRef: formRefProp },
  ref
) {
  const resolvedRef = formRefProp ?? ref;
  const [items, setItems] = useState<FaqItem[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isDirty = items.length > 0 && initialSnapshot !== "" && itemsSnapshot(items) !== initialSnapshot;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const performSave = useCallback(async (): Promise<void> => {
    if (items.length === 0) return;
    const invalid = items.some((item) => !item.question.trim() || !item.answer.trim());
    if (invalid) throw new Error("Все вопросы и ответы должны быть заполнены");
    const res = await fetch("/api/admin/home-faq", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const responseData = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(responseData.error || "Ошибка сохранения");
    const updated = responseData.items ?? items;
    setItems(updated);
    setInitialSnapshot(itemsSnapshot(updated));
  }, [items]);

  useImperativeHandle(
    resolvedRef,
    () => ({
      save: async () => {
        setSaving(true);
        setError("");
        try {
          await performSave();
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } catch (e) {
          setError((e as Error).message || "Не удалось сохранить");
          throw e;
        } finally {
          setSaving(false);
        }
      },
      resetToInitial: () => {
        if (initialSnapshot === "") return;
        try {
          const parsed = JSON.parse(initialSnapshot) as FaqItem[];
          setItems(parsed);
        } catch {
          // ignore
        }
      },
    }),
    [initialSnapshot, performSave]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/home-faq");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[AdminFaq] Ошибка загрузки:", res.status, errData);
        setItems(DEFAULT_FAQ_ITEMS);
        setInitialSnapshot(itemsSnapshot(DEFAULT_FAQ_ITEMS));
        return;
      }
      const data = await res.json();
      const loadedItems = Array.isArray(data.items) && data.items.length > 0 ? data.items : DEFAULT_FAQ_ITEMS;
      setItems(loadedItems);
      setInitialSnapshot(itemsSnapshot(loadedItems));
      if (data._tableMissing) {
        setError(
          "⚠️ Таблица home_reviews не создана. Выполните миграцию из scripts/migrations/home-reviews-extend.sql"
        );
      }
    } catch (e) {
      console.error("[AdminFaq] Исключение при загрузке:", e);
      setItems(DEFAULT_FAQ_ITEMS);
      setInitialSnapshot(itemsSnapshot(DEFAULT_FAQ_ITEMS));
      setError("Не удалось загрузить данные. Используются значения по умолчанию.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Должен быть хотя бы один вопрос");
      return;
    }
    const invalidItems = items.filter((item) => !item.question.trim() || !item.answer.trim());
    if (invalidItems.length > 0) {
      setError("Все вопросы и ответы должны быть заполнены");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await performSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message || "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  }

  function addItem() {
    const newId = `item-${Date.now()}`;
    setItems([...items, { id: newId, question: "", answer: "" }]);
    setExpandedId(newId);
  }

  function removeItem(id: string) {
    if (items.length <= 1) {
      setError("Должен быть хотя бы один вопрос");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
    setError("");
    if (expandedId === id) setExpandedId(null);
  }

  function moveItem(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
  }

  function updateItem(id: string, field: "question" | "answer", value: string) {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    setDraggedIndex(null);
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) return;
    const newItems = [...items];
    const [removed] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, removed);
    setItems(newItems);
  }

  function resetToInitial() {
    if (initialSnapshot === "") return;
    try {
      const parsed = JSON.parse(initialSnapshot) as FaqItem[];
      setItems(parsed);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
        >
          <Plus className="w-4 h-4" />
          Добавить вопрос
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSave} className="space-y-2">
        {items.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const shortQuestion = item.question.trim()
            ? item.question.length > 50
              ? item.question.slice(0, 50) + "…"
              : item.question
            : "Вопрос без текста";
          return (
            <div
              key={item.id}
              className={`border rounded-lg bg-white overflow-hidden ${draggedIndex === index ? "opacity-60" : ""}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="flex items-stretch border-b border-gray-100">
                {/* Drag handle — только здесь начинается перетаскивание */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-center w-9 shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 border-r border-gray-100"
                  aria-label="Перетащить"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
                <div
                  className="flex-1 flex items-center gap-2 min-w-0 py-2 px-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <span className="shrink-0 text-gray-500">
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </span>
                  <span className="text-sm font-medium text-[#111] truncate">
                    Вопрос {index + 1}: {shortQuestion}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 border-l border-gray-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(index, "up");
                    }}
                    disabled={index === 0}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Вверх"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(index, "down");
                    }}
                    disabled={index === items.length - 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Вниз"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    disabled={items.length <= 1}
                    className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="p-3 space-y-3 bg-gray-50/50" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Вопрос</label>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateItem(item.id, "question", e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
                      placeholder="Введите вопрос"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Ответ</label>
                    <textarea
                      value={item.answer}
                      onChange={(e) => updateItem(item.id, "answer", e.target.value)}
                      rows={3}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-[#111] text-sm"
                      placeholder="Введите ответ"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2 pt-3">
          <button
            type="submit"
            disabled={saving || items.length === 0}
            className="rounded text-white px-4 py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
          >
            {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={resetToInitial}
            disabled={!isDirty || saving}
            className="rounded border border-gray-300 px-4 py-2 text-[#111] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отменить изменения
          </button>
        </div>
      </form>
    </div>
  );
});
