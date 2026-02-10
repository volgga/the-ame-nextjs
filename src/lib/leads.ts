/**
 * Типы и утилиты для работы с таблицей leads в Supabase.
 */

import type { OneClickFormData, BouquetFormData, GiftHintFormData, PreorderFormData } from "./format";

export type LeadType = "one_click" | "bouquet" | "gift_hint" | "preorder";

/**
 * Payload для типа one_click
 */
export type OneClickPayload = OneClickFormData;

/**
 * Payload для типа bouquet
 */
export type BouquetPayload = BouquetFormData;

/**
 * Payload для типа gift_hint
 */
export type GiftHintPayload = GiftHintFormData;

/**
 * Payload для типа preorder
 */
export type PreorderPayload = PreorderFormData;

/**
 * Данные для вставки в таблицу leads
 */
export interface LeadInsert {
  type: LeadType;
  name: string | null;
  phone: string;
  payload: OneClickPayload | BouquetPayload | GiftHintPayload | PreorderPayload;
  page_url: string | null;
}

/**
 * Создает payload для one_click формы
 */
export function createOneClickPayload(data: OneClickFormData): OneClickPayload {
  return {
    phone: data.phone,
    name: data.name ?? null,
    productTitle: data.productTitle ?? null,
    pageUrl: data.pageUrl ?? null,
    productId: data.productId ?? null,
    productUrl: data.productUrl ?? null,
    productPath: data.productPath ?? null,
  };
}

/**
 * Создает payload для bouquet формы
 */
export function createBouquetPayload(data: BouquetFormData): BouquetPayload {
  return {
    phone: data.phone,
    name: data.name ?? null,
    message: data.message ?? null,
    comment: data.comment ?? null,
    pageUrl: data.pageUrl ?? null,
  };
}

/**
 * Создает payload для gift_hint формы
 */
export function createGiftHintPayload(data: GiftHintFormData): GiftHintPayload {
  return {
    phone: data.phone,
    name: data.name ?? null,
    recipientName: data.recipientName ?? null,
    preferredDate: data.preferredDate ?? null,
    comment: data.comment ?? null,
    pageUrl: data.pageUrl ?? null,
    productTitle: data.productTitle ?? null,
    productId: data.productId ?? null,
    productUrl: data.productUrl ?? null,
    productPath: data.productPath ?? null,
  };
}

/**
 * Создает payload для preorder формы
 */
export function createPreorderPayload(data: PreorderFormData): PreorderPayload {
  return {
    phone: data.phone,
    name: data.name ?? null,
    preorderDate: data.preorderDate,
    productTitle: data.productTitle ?? null,
    pageUrl: data.pageUrl ?? null,
    productId: data.productId ?? null,
    productUrl: data.productUrl ?? null,
    productPath: data.productPath ?? null,
  };
}
