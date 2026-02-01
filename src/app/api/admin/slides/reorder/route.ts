import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) })),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Update each slide's sort_order
    for (const item of parsed.data.items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("hero_slides")
        .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/slides/reorder POST]", e);
    return NextResponse.json({ error: "Ошибка сохранения порядка" }, { status: 500 });
  }
}
