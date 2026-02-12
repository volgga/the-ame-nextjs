"use client";

import { useCallback, useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Если true, при закрытии (крестик/ESC/overlay) показывается confirm "Сохранить изменения?" */
  unsavedChanges?: boolean;
  /** Вызывается при выборе "Да" в confirm; после успешного сохранения родитель должен вызвать onClose */
  onSaveAndClose?: () => Promise<void>;
  /** Опциональный footer (кнопки) - фиксируется внизу модалки */
  footer?: ReactNode;
};

// Z-index для админских модалок (выше всего админского UI)
const Z_OVERLAY = 9998;
const Z_PANEL = 9999;

/**
 * Modal — универсальный компонент модального окна для админки.
 * Закрытие: крестик, overlay, Escape. При unsavedChanges — confirm.
 * Компактный вид: малая шапка, max-height calc(100vh - отступы), контент скроллится.
 * Адаптивный: корректно работает на mobile/desktop.
 * Блокирует прокрутку страницы при открытии.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  unsavedChanges = false,
  onSaveAndClose,
  footer,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  const requestClose = useCallback(() => {
    if (unsavedChanges) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }, [unsavedChanges, onClose]);

  const handleConfirmYes = useCallback(async () => {
    if (!onSaveAndClose) {
      onClose();
      setShowConfirm(false);
      return;
    }
    setSaving(true);
    try {
      await onSaveAndClose();
      setShowConfirm(false);
      onClose();
    } catch {
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  }, [onSaveAndClose, onClose]);

  const handleConfirmNo = useCallback(() => {
    setShowConfirm(false);
    onClose();
  }, [onClose]);

  // Блокировка скролла страницы при открытой модалке
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;
    if (isOpen) {
      // Сохраняем текущий scroll position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Восстанавливаем scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
      setShowConfirm(false);
    }
    return () => {
      // Cleanup: восстанавливаем scroll при размонтировании
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [isOpen]);

  // Закрытие по Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirm) {
          setShowConfirm(false);
        } else {
          requestClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, showConfirm, requestClose]);

  if (!mounted || !isOpen) return null;

  // Защита от SSR/гидрации: document.body доступен только в браузере
  if (typeof document === "undefined" || !document.body) return null;

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      style={{ zIndex: Z_OVERLAY }}
    >
      <div
        className="absolute inset-0 bg-black/40 transition-opacity backdrop-blur-sm"
        onClick={showConfirm ? undefined : requestClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-[720px] sm:max-w-[960px] max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col border border-border-block"
        style={{ zIndex: Z_PANEL }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Компактная шапка */}
        <div className="flex items-center justify-between py-3 px-4 sm:px-6 border-b border-border-block flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#111] truncate pr-2">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            className="p-1.5 rounded-full text-gray-500 hover:text-[#111] hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-btn flex-shrink-0"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Скроллируемый контент */}
        <div className="overflow-y-auto flex-1 min-h-0 p-4 sm:p-6" style={{ overscrollBehavior: "contain" }}>
          {children}
        </div>

        {/* Footer (если передан) */}
        {footer && (
          <div className="flex-shrink-0 border-t border-border-block p-4 sm:p-6">{footer}</div>
        )}
      </div>

      {/* Confirm при несохранённых изменениях */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ zIndex: Z_PANEL + 1 }}>
          <div className="bg-white rounded-xl shadow-xl border border-border-block p-4 w-full max-w-sm">
            <p className="text-[#111] font-medium mb-3">Сохранить изменения?</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleConfirmNo}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-[#111] hover:bg-gray-50"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={handleConfirmYes}
                disabled={saving}
                className="rounded px-3 py-1.5 text-sm text-white bg-accent-btn hover:bg-accent-btn-hover disabled:opacity-50"
              >
                {saving ? "Сохранение…" : "Да"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
