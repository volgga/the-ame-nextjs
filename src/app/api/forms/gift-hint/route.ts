/**
 * POST /api/forms/gift-hint — обработка формы "Намекнуть о подарке".
 * Валидирует данные и отправляет сообщение в Telegram.
 */

import { NextResponse } from "next/server";
import { sendToTelegram } from "@/lib/telegram";
import { formatGiftHintMessage, type GiftHintFormData } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LENGTH = {
  name: 100,
  recipientName: 100,
  preferredDate: 50,
  comment: 300,
  pageUrl: 500,
};

/**
 * Валидирует и нормализует данные формы.
 */
function validateAndParse(body: unknown): GiftHintFormData | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Тело запроса должно быть объектом" };
  }

  const data = body as Record<string, unknown>;

  // Обязательное поле: phone
  if (!data.phone || typeof data.phone !== "string") {
    return { error: "Поле 'phone' обязательно и должно быть строкой" };
  }

  const phone = data.phone.trim();
  if (phone.length === 0) {
    return { error: "Поле 'phone' не может быть пустым" };
  }
  if (phone.length > 50) {
    return { error: "Поле 'phone' слишком длинное (максимум 50 символов)" };
  }

  // Опциональные поля с валидацией
  const result: GiftHintFormData = { phone };

  if (data.name !== undefined && data.name !== null) {
    if (typeof data.name !== "string") {
      return { error: "Поле 'name' должно быть строкой" };
    }
    const name = data.name.trim();
    if (name.length > MAX_LENGTH.name) {
      return { error: `Поле 'name' слишком длинное (максимум ${MAX_LENGTH.name} символов)` };
    }
    result.name = name.length > 0 ? name : null;
  }

  if (data.recipientName !== undefined && data.recipientName !== null) {
    if (typeof data.recipientName !== "string") {
      return { error: "Поле 'recipientName' должно быть строкой" };
    }
    const recipientName = data.recipientName.trim();
    if (recipientName.length > MAX_LENGTH.recipientName) {
      return { error: `Поле 'recipientName' слишком длинное (максимум ${MAX_LENGTH.recipientName} символов)` };
    }
    result.recipientName = recipientName.length > 0 ? recipientName : null;
  }

  if (data.preferredDate !== undefined && data.preferredDate !== null) {
    if (typeof data.preferredDate !== "string") {
      return { error: "Поле 'preferredDate' должно быть строкой" };
    }
    const preferredDate = data.preferredDate.trim();
    if (preferredDate.length > MAX_LENGTH.preferredDate) {
      return { error: `Поле 'preferredDate' слишком длинное (максимум ${MAX_LENGTH.preferredDate} символов)` };
    }
    result.preferredDate = preferredDate.length > 0 ? preferredDate : null;
  }

  if (data.comment !== undefined && data.comment !== null) {
    if (typeof data.comment !== "string") {
      return { error: "Поле 'comment' должно быть строкой" };
    }
    const comment = data.comment.trim();
    if (comment.length > MAX_LENGTH.comment) {
      return { error: `Поле 'comment' слишком длинное (максимум ${MAX_LENGTH.comment} символов)` };
    }
    result.comment = comment.length > 0 ? comment : null;
  }

  if (data.pageUrl !== undefined && data.pageUrl !== null) {
    if (typeof data.pageUrl !== "string") {
      return { error: "Поле 'pageUrl' должно быть строкой" };
    }
    const pageUrl = data.pageUrl.trim();
    if (pageUrl.length > MAX_LENGTH.pageUrl) {
      return { error: `Поле 'pageUrl' слишком длинное (максимум ${MAX_LENGTH.pageUrl} символов)` };
    }
    result.pageUrl = pageUrl.length > 0 ? pageUrl : null;
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = validateAndParse(rawBody);

    if ("error" in parsed) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const message = formatGiftHintMessage(parsed);
    await sendToTelegram(message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[forms/gift-hint] Ошибка:", error);
    const errorMessage = error instanceof Error ? error.message : "Ошибка сервера";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
