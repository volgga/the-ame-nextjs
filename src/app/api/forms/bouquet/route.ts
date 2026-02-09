/**
 * POST /api/forms/bouquet — обработка формы "Заказать букет".
 * Валидирует данные и отправляет сообщение в Telegram.
 */

import { NextResponse } from "next/server";
import { sendToTelegram } from "@/lib/telegram";
import { formatBouquetMessage, type BouquetFormData } from "@/lib/format";
import { checkRateLimit, getClientIP, checkHoneypot, cleanupRateLimit } from "@/lib/formSecurity";
import { validatePhone, validateStringField } from "@/lib/formValidation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createBouquetPayload } from "@/lib/leads";
import { logLeadEvent, getIPFromRequest, getUserAgentFromRequest } from "@/lib/leadEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORM_TYPE = "bouquet";

// Периодическая очистка rate limit (каждый 10-й запрос)
let requestCount = 0;

/**
 * Валидирует и нормализует данные формы.
 */
function validateAndParse(body: unknown): BouquetFormData | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Тело запроса должно быть объектом" };
  }

  const data = body as Record<string, unknown>;

  // Валидация телефона (обязательное поле)
  if (!data.phone || typeof data.phone !== "string") {
    return { error: "Поле 'phone' обязательно и должно быть строкой" };
  }
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.valid) {
    return { error: phoneValidation.error! };
  }

  const result: BouquetFormData = { phone: phoneValidation.normalized! };

  // Валидация опциональных полей
  const nameValidation = validateStringField(data.name, "name", 80, false);
  if (!nameValidation.valid) {
    return { error: nameValidation.error! };
  }
  result.name = nameValidation.normalized;

  const messageValidation = validateStringField(data.message, "message", 500, false);
  if (!messageValidation.valid) {
    return { error: messageValidation.error! };
  }
  result.message = messageValidation.normalized;

  const commentValidation = validateStringField(data.comment, "comment", 500, false);
  if (!commentValidation.valid) {
    return { error: commentValidation.error! };
  }
  result.comment = commentValidation.normalized;

  const pageUrlValidation = validateStringField(data.pageUrl, "pageUrl", 200, false);
  if (!pageUrlValidation.valid) {
    return { error: pageUrlValidation.error! };
  }
  result.pageUrl = pageUrlValidation.normalized;

  return result;
}

export async function POST(request: Request) {
  try {
    // Периодическая очистка rate limit
    requestCount++;
    if (requestCount % 10 === 0) {
      cleanupRateLimit();
    }

    // Проверка rate limit
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      await logLeadEvent("rate_limited", {
        formType: FORM_TYPE,
        ip: getIPFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ ok: false, error: "Тело запроса должно быть объектом" }, { status: 400 });
    }

    const data = rawBody as Record<string, unknown>;

    // Проверка honeypot
    if (!checkHoneypot(data)) {
      // Бот заполнил honeypot - возвращаем успех, но ничего не делаем
      await logLeadEvent("honeypot", {
        formType: FORM_TYPE,
        ip: getIPFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });
      return NextResponse.json({ ok: true });
    }

    const parsed = validateAndParse(rawBody);

    if ("error" in parsed) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    // Логируем событие received
    await logLeadEvent("received", {
      formType: FORM_TYPE,
      ip: getIPFromRequest(request),
      userAgent: getUserAgentFromRequest(request),
      pageUrl: parsed.pageUrl || undefined,
      phone: parsed.phone,
    });

    // Сохранение в Supabase
    let leadId: string | undefined;
    try {
      const supabase = getSupabaseAdmin();
      const payload = createBouquetPayload(parsed);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: leadData, error: supabaseError } = await (supabase as any)
        .from("leads")
        .insert({
          type: "bouquet",
          name: parsed.name,
          phone: parsed.phone,
          payload,
          page_url: parsed.pageUrl,
        })
        .select("id")
        .single();

      if (supabaseError) {
        console.error(`[forms/${FORM_TYPE}] saved_failed error=${supabaseError.message}`);
        await logLeadEvent("saved_failed", { formType: FORM_TYPE, error: supabaseError.message });
      } else if (leadData?.id) {
        leadId = leadData.id;
        await logLeadEvent(
          "saved",
          {
            formType: FORM_TYPE,
          },
          leadId
        );
      }
    } catch (supabaseErr) {
      const errorMessage = supabaseErr instanceof Error ? supabaseErr.message : String(supabaseErr);
      console.error(`[forms/${FORM_TYPE}] saved_failed error=${errorMessage}`);
      await logLeadEvent("saved_failed", { formType: FORM_TYPE, error: errorMessage });
    }

    // Отправка в Telegram (best effort: лид уже в БД, TG вторично)
    try {
      const message = formatBouquetMessage(parsed, leadId);
      await sendToTelegram(message);
      await logLeadEvent("tg_sent", { formType: FORM_TYPE }, leadId);
    } catch (tgError) {
      const errorMessage = tgError instanceof Error ? tgError.message : String(tgError);
      console.error(`[forms/${FORM_TYPE}] tg_failed leadId=${leadId ?? "—"} error=${errorMessage}`);
      await logLeadEvent("tg_failed", { formType: FORM_TYPE, error: errorMessage }, leadId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[forms/${FORM_TYPE}] unexpected error=${msg}`);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
