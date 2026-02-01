/**
 * POST /api/one-click-order — заявка «Купить в 1 клик».
 * Пишет в таблицу one_click_orders через Supabase (service role, только на сервере).
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const bodySchema = {
  productId: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  productTitle: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  price: (v: unknown) => typeof v === "number" && !Number.isNaN(v) && v >= 0,
  phone: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  name: (v: unknown) => v === undefined || v === null || typeof v === "string",
};

function parseBody(
  raw: unknown
): { productId: string; productTitle: string; price: number; phone: string; name: string | null } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!bodySchema.productId(o.productId)) return null;
  if (!bodySchema.productTitle(o.productTitle)) return null;
  if (!bodySchema.price(o.price)) return null;
  if (!bodySchema.phone(o.phone)) return null;
  if (!bodySchema.name(o.name)) return null;
  const name = o.name;
  return {
    productId: (o.productId as string).trim(),
    productTitle: (o.productTitle as string).trim(),
    price: Number(o.price),
    phone: (o.phone as string).trim(),
    name: name != null && typeof name === "string" ? name.trim() || null : null,
  };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const parsed = parseBody(raw);

    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "Неверные данные: нужны productId, productTitle, price, phone" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    // Таблица не в сгенерированных типах — приведение
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("one_click_orders").insert({
      product_id: parsed.productId,
      product_title: parsed.productTitle,
      price: parsed.price,
      phone: parsed.phone,
      name: parsed.name,
      status: "new",
    });

    if (error) {
      console.error("[one-click-order] Supabase insert error:", error.message);
      return NextResponse.json({ ok: false, error: "Ошибка сохранения заявки" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[one-click-order] Exception:", err);
    return NextResponse.json({ ok: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
