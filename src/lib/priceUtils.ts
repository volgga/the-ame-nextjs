/**
 * Эффективная цена с учётом скидки.
 * Скидка активна, если заданы discountPercent > 0 и discountPrice > 0;
 * тогда при оплате и на витрине используется discountPrice.
 */

export type EntityWithPrice = {
  price: number;
  discountPercent?: number | null;
  discountPrice?: number | null;
};

/** Скидка активна: заданы процент и цена со скидкой */
export function isDiscountActive(entity: EntityWithPrice): boolean {
  const pct = entity.discountPercent;
  const dp = entity.discountPrice;
  return (
    typeof pct === "number" && pct > 0 && typeof dp === "number" && dp > 0
  );
}

/** Цена для оплаты и отображения: при активной скидке — discountPrice, иначе base price */
export function getEffectivePrice(entity: EntityWithPrice): number {
  return isDiscountActive(entity) ? Number(entity.discountPrice) : entity.price;
}

/** Рассчитанная цена по проценту (для подсказки в админке) */
export function calcPriceFromPercent(basePrice: number, percent: number): number {
  if (percent <= 0 || percent >= 100) return basePrice;
  return Math.round((basePrice * (100 - percent)) / 100);
}
