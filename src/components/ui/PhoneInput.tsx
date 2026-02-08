"use client";

import React from "react";
import ReactPhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

/** Нормализует значение к E.164 (с префиксом +). */
export function toE164(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim().replace(/\s/g, "");
  if (!trimmed) return "";
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

/** Валидация: минимум 10 цифр (код страны + номер). */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

export type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  name?: string;
  disabled?: boolean;
  defaultCountry?: string;
  id?: string;
  placeholder?: string;
};

/**
 * Единый компонент телефонного ввода (react-phone-input-2): флаг, список стран, поиск, автоформатирование.
 * value/onChange — сырое значение от библиотеки; для submit используйте toE164(value), для валидации — isValidPhone(toE164(value)).
 */
export function PhoneInput({
  value,
  onChange,
  label,
  required,
  error,
  name,
  disabled,
  defaultCountry = "ru",
  id,
  placeholder = "Введите номер",
}: PhoneInputProps) {
  const wrapperClass = `phone-input-root ${error ? "has-error" : ""}`;

  return (
    <div className={wrapperClass}>
      {label != null && (
        <label htmlFor={id} className="block text-sm font-medium text-color-text-main mb-1">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <ReactPhoneInput
        country={defaultCountry}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        enableSearch
        searchPlaceholder="Поиск страны"
        searchNotFound="Страны не найдены"
        disabled={disabled}
        containerClass="phone-input-container"
        inputClass="phone-input-input"
        buttonClass="phone-input-button"
        dropdownClass="phone-input-dropdown"
        searchClass="phone-input-search"
        inputProps={{
          id: id ?? undefined,
          name: name ?? undefined,
          "aria-label": label ?? "Номер телефона",
          autoComplete: "tel",
        }}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
