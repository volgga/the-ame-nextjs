import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Ошибка загрузки";
}

/** GET /api/blog — список опубликованных постов */
export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ posts: data ?? [] });
  } catch (e) {
    console.error("[api/blog GET]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
