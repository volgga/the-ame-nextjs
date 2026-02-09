import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Ошибка загрузки";
}

type RouteParams = {
  params: Promise<{ slug: string }>;
};

/** GET /api/blog/[slug] — получение одного опубликованного поста */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ post: data });
  } catch (e) {
    console.error("[api/blog/[slug] GET]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
