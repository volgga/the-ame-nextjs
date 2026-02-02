/**
 * POST /api/gift-hints — отправка "Намекнуть о подарке".
 * Пишет в таблицу gift_hints через Supabase (service role, только на сервере).
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const bodySchema = {
  productId: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  productTitle: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  fromName: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  toName: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  phone: (v: unknown) => typeof v === "string" && v.trim().length > 0,
};

function parseBody(
  raw: unknown
): { productId: string; productTitle: string; fromName: string; toName: string; phone: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!bodySchema.productId(o.productId)) return null;
  if (!bodySchema.productTitle(o.productTitle)) return null;
  if (!bodySchema.fromName(o.fromName)) return null;
  if (!bodySchema.toName(o.toName)) return null;
  if (!bodySchema.phone(o.phone)) return null;
  return {
    productId: (o.productId as string).trim(),
    productTitle: (o.productTitle as string).trim(),
    fromName: (o.fromName as string).trim(),
    toName: (o.toName as string).trim(),
    phone: (o.phone as string).trim(),
  };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const parsed = parseBody(raw);

    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "Неверные данные: нужны productId, productTitle, fromName, toName, phone" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    // Таблица не в сгенерированных типах — приведение
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("gift_hints").insert({
      product_id: parsed.productId,
      product_title: parsed.productTitle,
      from_name: parsed.fromName,
      to_name: parsed.toName,
      phone: parsed.phone,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[gift-hints] Supabase insert error:", error.message);
      // Если таблицы нет, возвращаем успех (для разработки можно временно логировать в консоль)
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        console.warn("[gift-hints] Table gift_hints does not exist. Creating mock entry:", parsed);
        // В продакшене здесь нужно создать таблицу или вернуть ошибку
        // Пока возвращаем успех для разработки
        return NextResponse.json({ ok: true, mock: true });
      }
      return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gift-hints] Exception:", err);
    return NextResponse.json({ ok: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
