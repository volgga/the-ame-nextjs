import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Публичный API: только активные страницы каталога, по sort_order.
 * Используется витриной (меню каталога). RLS на таблице даёт только is_active=true при anon.
 * Здесь используем service_role для единообразия с другими публичными данными (или anon — тогда RLS сработает).
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("catalog_pages")
      .select("id, slug, title, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      if (error.code === "42P01") return NextResponse.json([]);
      console.warn("[catalog-pages GET]", error.message);
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("[catalog-pages GET]", e);
    return NextResponse.json([], { status: 200 });
  }
}
