import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

export type ProductDetailsResponse = {
  kit: string;
};

const DEFAULT: ProductDetailsResponse = {
  kit: "",
};

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("product_details").select("kit").eq("id", 1).maybeSingle();

    if (error) {
      const isTableMissing =
        error.code === "42P01" ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes("does not exist");
      if (isTableMissing) {
        return NextResponse.json({ ...DEFAULT, _tableMissing: true });
      }
      return NextResponse.json(DEFAULT);
    }

    if (!data) return NextResponse.json(DEFAULT);

    return NextResponse.json({
      kit: typeof data.kit === "string" ? data.kit : "",
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/product-details GET]", e);
    return NextResponse.json(DEFAULT);
  }
}

const updateSchema = z.object({
  kit: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.kit !== undefined) updateData.kit = parsed.data.kit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("product_details")
      .update(updateData)
      .eq("id", 1)
      .select("kit")
      .maybeSingle();

    if (error) {
      const isTableMissing =
        error.code === "42P01" ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes("does not exist");
      if (isTableMissing) {
        return NextResponse.json(
          { error: "Таблица product_details не создана. Выполните миграцию scripts/migrations/product-details.sql" },
          { status: 500 }
        );
      }
      console.error("[admin/product-details PATCH]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      kit: data?.kit ?? "",
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/product-details PATCH]", e);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
  }
}
