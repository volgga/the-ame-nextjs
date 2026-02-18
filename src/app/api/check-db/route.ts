import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";

/**
 * Диагностика подключения к Supabase.
 * GET /api/check-db — пробует получить один товар и возвращает результат.
 * Удалить после отладки.
 */
export async function GET() {
  const result: Record<string, unknown> = {
    ok: false,
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  try {
    // Пробуем через service role (если есть), иначе через anon
    const db =
      typeof process.env.SUPABASE_SERVICE_ROLE_KEY === "string" && process.env.SUPABASE_SERVICE_ROLE_KEY
        ? getSupabaseAdmin()
        : supabase;

    const { data, error } = await db
      .from("products")
      .select("id, name, slug, image_url, price")
      .limit(1)
      .maybeSingle();

    if (error) {
      result.error = error.message;
      result.code = error.code;
      result.details = error.details;
      return NextResponse.json(result, { status: 500 });
    }

    if (!data) {
      result.ok = true;
      result.product = null;
      result.message = "Таблица products пуста или нет активных записей.";
      return NextResponse.json(result);
    }

    result.ok = true;
    result.product = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      image_url: data.image_url ? "present" : null,
      price: data.price,
    };
    result.message = "Подключение к БД успешно, товар получен.";
    return NextResponse.json(result);
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    result.stack = e instanceof Error ? e.stack : undefined;
    return NextResponse.json(result, { status: 500 });
  }
}
