/**
 * POST /api/forms/one-click — обработка формы "Купить в 1 клик".
 * Валидирует данные и отправляет сообщение в Telegram.
 */

import { NextResponse } from "next/server";
import { sendToTelegram } from "@/lib/telegram";
import { formatOneClickMessage, type OneClickFormData } from "@/lib/format";
import { checkRateLimit, getClientIP, checkHoneypot, cleanupRateLimit } from "@/lib/formSecurity";
import { validatePhone, validateStringField } from "@/lib/formValidation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createOneClickPayload } from "@/lib/leads";
import { logLeadEvent, getIPFromRequest, getUserAgentFromRequest } from "@/lib/leadEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORM_TYPE = "one-click";

// Периодическая очистка rate limit (каждый 10-й запрос)
let requestCount = 0;

/**
 * Валидирует и нормализует данные формы.
 */
function validateAndParse(body: unknown): OneClickFormData | { error: string } {
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

  const result: OneClickFormData = { phone: phoneValidation.normalized! };

  // Валидация опциональных полей
  const nameValidation = validateStringField(data.name, "name", 80, false);
  if (!nameValidation.valid) {
    return { error: nameValidation.error! };
  }
  result.name = nameValidation.normalized;

  const productTitleValidation = validateStringField(data.productTitle, "productTitle", 200, false);
  if (!productTitleValidation.valid) {
    return { error: productTitleValidation.error! };
  }
  result.productTitle = productTitleValidation.normalized;

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
      const payload = createOneClickPayload(parsed);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: leadData, error: supabaseError } = await (supabase as any)
        .from("leads")
        .insert({
          type: "one_click",
          name: parsed.name,
          phone: parsed.phone,
          payload,
          page_url: parsed.pageUrl,
        })
        .select("id")
        .single();

      if (supabaseError) {
        console.error(`[forms/${FORM_TYPE}] Ошибка Supabase при сохранении:`, {
          formType: FORM_TYPE,
          phone: parsed.phone.substring(0, 5) + "***",
          name: parsed.name?.substring(0, 3) + "***" || "не указано",
          error: supabaseError.message,
        });
        await logLeadEvent("saved_failed", {
          formType: FORM_TYPE,
          error: supabaseError.message,
        });
        // Продолжаем выполнение - попробуем отправить в TG
      } else if (leadData?.id) {
        leadId = leadData.id;
        await logLeadEvent("saved", {
          formType: FORM_TYPE,
        }, leadId);
      }
    } catch (supabaseErr) {
      const errorMessage = supabaseErr instanceof Error ? supabaseErr.message : String(supabaseErr);
      console.error(`[forms/${FORM_TYPE}] Неожиданная ошибка Supabase:`, {
        formType: FORM_TYPE,
        phone: parsed.phone.substring(0, 5) + "***",
        name: parsed.name?.substring(0, 3) + "***" || "не указано",
        error: errorMessage,
      });
      await logLeadEvent("saved_failed", {
        formType: FORM_TYPE,
        error: errorMessage,
      });
      // Продолжаем выполнение - попробуем отправить в TG
    }

    // Отправка в Telegram
    try {
      const message = formatOneClickMessage(parsed, leadId);
      await sendToTelegram(message);
      await logLeadEvent("tg_sent", {
        formType: FORM_TYPE,
      }, leadId);
    } catch (tgError) {
      const errorMessage = tgError instanceof Error ? tgError.message : String(tgError);
      console.error(`[forms/${FORM_TYPE}] Ошибка Telegram:`, {
        formType: FORM_TYPE,
        phone: parsed.phone.substring(0, 5) + "***",
        name: parsed.name?.substring(0, 3) + "***" || "не указано",
        leadId: leadId || "не сохранен",
        error: errorMessage,
      });
      await logLeadEvent("tg_failed", {
        formType: FORM_TYPE,
        error: errorMessage,
      }, leadId);
      return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[forms/${FORM_TYPE}] Неожиданная ошибка:`, {
      formType: FORM_TYPE,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
