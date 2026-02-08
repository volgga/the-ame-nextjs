/**
 * Утилиты валидации и нормализации данных форм.
 */

/**
 * Нормализует строку: trim и заменяет множественные пробелы на один.
 */
export function normalizeString(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Валидирует телефонный номер.
 * Разрешает: +, цифры, пробелы, скобки, дефисы.
 * Длина: 6-30 символов.
 */
export function validatePhone(phone: string): { valid: boolean; error?: string; normalized?: string } {
  const normalized = normalizeString(phone);

  if (normalized.length === 0) {
    return { valid: false, error: "Поле 'phone' обязательно и не может быть пустым" };
  }

  if (normalized.length < 6) {
    return { valid: false, error: "Поле 'phone' слишком короткое (минимум 6 символов)" };
  }

  if (normalized.length > 30) {
    return { valid: false, error: "Поле 'phone' слишком длинное (максимум 30 символов)" };
  }

  // Разрешаем: +, цифры, пробелы, скобки, дефисы
  const phoneRegex = /^[\d+\s()\-]+$/;
  if (!phoneRegex.test(normalized)) {
    return { valid: false, error: "Поле 'phone' содержит недопустимые символы" };
  }

  return { valid: true, normalized };
}

/**
 * Валидирует строковое поле с ограничением длины.
 */
export function validateStringField(
  value: unknown,
  fieldName: string,
  maxLength: number,
  required: boolean = false
): { valid: boolean; error?: string; normalized?: string | null } {
  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, error: `Поле '${fieldName}' обязательно` };
    }
    return { valid: true, normalized: null };
  }

  if (typeof value !== "string") {
    return { valid: false, error: `Поле '${fieldName}' должно быть строкой` };
  }

  const normalized = normalizeString(value);

  if (required && normalized.length === 0) {
    return { valid: false, error: `Поле '${fieldName}' обязательно и не может быть пустым` };
  }

  if (normalized.length > maxLength) {
    return { valid: false, error: `Поле '${fieldName}' слишком длинное (максимум ${maxLength} символов)` };
  }

  return { valid: true, normalized: normalized.length > 0 ? normalized : null };
}
