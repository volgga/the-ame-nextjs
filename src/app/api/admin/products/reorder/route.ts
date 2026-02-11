import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sort_order: z.number().int().min(0) })),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    for (const item of parsed.data.items) {
      if (item.id.startsWith("vp-")) {
        const numericId = parseInt(item.id.slice(3), 10);
        if (Number.isNaN(numericId)) continue;
        const { error } = await sb.from("variant_products").update({ sort_order: item.sort_order }).eq("id", numericId);
        if (error) throw error;
      } else {
        const { error } = await sb.from("products").update({ sort_order: item.sort_order }).eq("id", item.id);
        if (error) throw error;
      }
    }

    revalidateTag("catalog-products", "max");
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products/reorder POST]", e);
    return NextResponse.json({ error: "Ошибка сохранения порядка" }, { status: 500 });
  }
}
