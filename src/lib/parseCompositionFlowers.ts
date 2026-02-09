/**
 * Парсинг состава букета для извлечения названий цветов.
 * Удаляет числа, единицы измерения, скобки и нормализует названия.
 *
 * Примеры:
 * - "Гортензия 1шт, Диантус 2шт" -> ["Гортензия", "Диантус"]
 * - "Розы 7 шт + Гортензия 1шт" -> ["Розы", "Гортензия"]
 * - "Эвкалипт 2 ветки; розы 5" -> ["Эвкалипт", "Розы"]
 */

const SEPARATORS = /[,;+\/]|\n/;
const NUMBER_PATTERN = /\d+/;
const UNIT_WORDS = /\b(шт|штук|штуки|ветка|веток|ветки|стебель|стеблей|стебля|pcs|pc)\b/gi;
const BRACKETS_PATTERN = /\s*\([^)]*\)\s*$/;

/**
 * Нормализует название цветка: убирает лишние пробелы, делает первую букву заглавной.
 */
function normalizeFlowerName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (word.length === 0) return "";
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Извлекает название цветка из фрагмента состава.
 * Удаляет числа, единицы измерения, скобки.
 */
function extractFlowerName(fragment: string): string | null {
  let cleaned = fragment.trim();
  if (cleaned.length < 2) return null;

  // Удаляем скобки в конце (например "Розы (Кения)" -> "Розы")
  cleaned = cleaned.replace(BRACKETS_PATTERN, "").trim();

  // Находим первое число и обрезаем строку до него
  const numberMatch = cleaned.match(NUMBER_PATTERN);
  if (numberMatch && numberMatch.index !== undefined) {
    cleaned = cleaned.substring(0, numberMatch.index).trim();
  }

  // Удаляем единицы измерения (если остались без числа)
  cleaned = cleaned.replace(UNIT_WORDS, "").trim();

  // Нормализуем пробелы и проверяем длину
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (cleaned.length < 2) return null;

  return normalizeFlowerName(cleaned);
}

/**
 * Парсит строку состава и возвращает массив уникальных названий цветов.
 * Сравнение по lowercase, но возвращаются нормализованные названия (с заглавной буквы).
 *
 * @param composition - строка состава (например "Гортензия 1шт, Диантус 2шт")
 * @returns массив уникальных названий цветов
 */
export function parseCompositionFlowers(composition: string | null | undefined): string[] {
  if (!composition || typeof composition !== "string") return [];

  const fragments = composition.split(SEPARATORS);
  const flowerSet = new Map<string, string>(); // lowercase -> normalized

  for (const fragment of fragments) {
    const flowerName = extractFlowerName(fragment);
    if (flowerName) {
      const lowerKey = flowerName.toLowerCase();
      // Сохраняем нормализованное название (первая буква заглавная)
      if (!flowerSet.has(lowerKey)) {
        flowerSet.set(lowerKey, flowerName);
      }
    }
  }

  return Array.from(flowerSet.values()).sort((a, b) => a.localeCompare(b, "ru"));
}

/**
 * Примеры использования (для тестов и документации):
 *
 * parseCompositionFlowers("Гортензия 1шт, Диантус 2шт")
 * // -> ["Гортензия", "Диантус"]
 *
 * parseCompositionFlowers("Розы 7 шт + Гортензия 1шт")
 * // -> ["Гортензия", "Розы"]
 *
 * parseCompositionFlowers("Эвкалипт 2 ветки; розы 5")
 * // -> ["Эвкалипт", "Розы"]
 *
 * parseCompositionFlowers("Розы (Кения) 10 шт")
 * // -> ["Розы"]
 *
 * parseCompositionFlowers("")
 * // -> []
 *
 * parseCompositionFlowers(null)
 * // -> []
 */
