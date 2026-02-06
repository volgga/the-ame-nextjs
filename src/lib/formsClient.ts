/**
 * Клиентские функции для отправки данных форм на сервер.
 */

import type { OneClickFormData, BouquetFormData, GiftHintFormData } from "./format";

/**
 * Ответ API формы
 */
export interface FormResponse {
  ok: boolean;
  error?: string;
}

/**
 * Отправляет данные формы "Купить в 1 клик".
 *
 * @param data - Данные формы
 * @returns Promise с ответом сервера
 */
export async function submitOneClick(data: OneClickFormData): Promise<FormResponse> {
  const response = await fetch("/api/forms/one-click", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return (await response.json()) as FormResponse;
}

/**
 * Отправляет данные формы "Заказать букет".
 *
 * @param data - Данные формы
 * @returns Promise с ответом сервера
 */
export async function submitBouquet(data: BouquetFormData): Promise<FormResponse> {
  const response = await fetch("/api/forms/bouquet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return (await response.json()) as FormResponse;
}

/**
 * Отправляет данные формы "Намекнуть о подарке".
 *
 * @param data - Данные формы
 * @returns Promise с ответом сервера
 */
export async function submitGiftHint(data: GiftHintFormData): Promise<FormResponse> {
  const response = await fetch("/api/forms/gift-hint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return (await response.json()) as FormResponse;
}
