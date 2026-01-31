// src/utils/slugify.ts

// Простая и надёжная транслитерация RU → EN + нормализация под URL
const ruMap: Record<string, string> = {
  ё:"yo", й:"y", ц:"ts", у:"u", к:"k", е:"e", н:"n", г:"g", ш:"sh", щ:"sch", з:"z", х:"h", ъ:"",
  ф:"f", ы:"y", в:"v", а:"a", п:"p", р:"r", о:"o", л:"l", д:"d", ж:"zh", э:"e",
  я:"ya", ч:"ch", с:"s", м:"m", и:"i", т:"t", ь:"", б:"b", ю:"yu",
  Ё:"yo", Й:"y", Ц:"ts", У:"u", К:"k", Е:"e", Н:"n", Г:"g", Ш:"sh", Щ:"sch", З:"z", Х:"h", Ъ:"",
  Ф:"f", Ы:"y", В:"v", А:"a", П:"p", Р:"r", О:"o", Л:"l", Д:"d", Ж:"zh", Э:"e",
  Я:"ya", Ч:"ch", С:"s", М:"m", И:"i", Т:"t", Ь:"", Б:"b", Ю:"yu",
};

function translitRuToLat(input: string): string {
  return Array.from(input).map(ch => ruMap[ch] ?? ch).join("");
}

/**
 * Делает slug: латиница + цифры + дефисы
 * - транслитерирует кириллицу
 * - убирает диакритику
 * - пробелы и разделители → "-"
 * - сжимает подряд и убирает крайние дефисы
 * - ограничивает длину
 */
export function slugify(input: string, maxLen = 120): string {
  if (!input) return "";
  // 1) транслитерация русских букв
  let s = translitRuToLat(input);
  // 2) убрать диакритику у латинских (é → e)
  s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  // 3) & → and (частый кейс в названиях)
  s = s.replace(/&/g, " and ");
  // 4) всё лишнее → дефисы
  s = s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // 5) убрать крайние и двойные дефисы
  s = s.replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
  // 6) ограничение длины
  if (s.length > maxLen) s = s.slice(0, maxLen).replace(/-+$/g, "");
  return s;
}

