/**
 * Форматирование цены в рублях: "12 990 ₽"
 */
export function formatPrice(n: number): string {
  return n.toLocaleString("ru-RU") + " ₽";
}
