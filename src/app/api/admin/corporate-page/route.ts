import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

const corporatePageSchema = z.object({
  title: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  images: z.array(z.string().url()).default([]),
  max_link: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
});

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") {
      let msg = obj.message;
      if (typeof obj.hint === "string" && obj.hint) msg += ` (${obj.hint})`;
      if (typeof obj.details === "string" && obj.details) msg += ` — ${obj.details}`;
      return msg;
    }
  }
  return "Ошибка операции";
}

/** GET /api/admin/corporate-page — данные страницы «Корпоративы» (админка) */
export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("corporate_page_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({
          settings: {
            id: 1,
            title: null,
            text: null,
            images: [],
            max_link: null,
            seo_title: null,
            seo_description: null,
            updated_at: new Date().toISOString(),
          },
        });
      }
      throw error;
    }

    const raw = data as {
      id: number;
      title: string | null;
      text: string | null;
      images: unknown;
      max_link: string | null;
      seo_title: string | null;
      seo_description: string | null;
      updated_at: string;
    };
    const images = Array.isArray(raw.images) ? raw.images : [];
    return NextResponse.json({
      settings: {
        ...raw,
        images: images.filter((u): u is string => typeof u === "string"),
      },
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/corporate-page GET]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}

/** PUT /api/admin/corporate-page — обновление настроек */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validated = corporatePageSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("corporate_page_settings")
      .upsert(
        {
          id: 1,
          title: validated.title?.trim() || null,
          text: validated.text?.trim() || null,
          images: validated.images ?? [],
          max_link: validated.max_link?.trim() || null,
          seo_title: validated.seo_title?.trim() || null,
          seo_description: validated.seo_description?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) throw error;

    revalidateTag("corporate-page", "max");
    revalidatePath("/corporate");
    return NextResponse.json({ settings: data });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Ошибка валидации" }, { status: 400 });
    }
    console.error("[admin/corporate-page PUT]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
