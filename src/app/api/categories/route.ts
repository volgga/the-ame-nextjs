import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * Публичный API для получения активных категорий каталога.
 * Используется в выпадающем меню "Каталог" на клиенте.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[api/categories GET]", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("[api/categories GET]", e);
    return NextResponse.json([], { status: 200 });
  }
}
