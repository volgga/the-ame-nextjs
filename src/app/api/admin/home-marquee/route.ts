import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { marqueeSettingToBoolean } from "@/lib/homeMarquee";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/** Парсит marquee_text из БД: JSON ["фраза1","фраза2"] или plain string → массив. */
function parsePhrasesResponse(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  const s = raw.trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s) as unknown;
      if (Array.isArray(arr)) {
        return arr
          .filter((x): x is string => typeof x === "string")
          .map((x) => String(x).trim())
          .filter((x) => x.length > 0);
      }
    } catch {
      /* fallback */
    }
  }
  return [s];
}

/** Валидная ссылка: пустая строка, относительный путь /... или абсолютный http(s):// */
function isValidLink(value: string): boolean {
  const s = value.trim();
  if (s === "") return true;
  if (s.startsWith("/")) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const updateSchema = z
  .object({
    enabled: z
      .union([z.boolean(), z.literal("true"), z.literal("false"), z.string()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        return v === true || v === "true" || String(v).toLowerCase() === "true";
      }),
    text: z.string().optional(),
    phrases: z.array(z.string()).optional(),
    link: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.link === undefined) return true;
      return isValidLink(data.link);
    },
    { message: "Ссылка должна быть пустой, относительной (/...) или начинаться с http:// / https://", path: ["link"] }
  )
  .refine(
    (data) => {
      const en = data.enabled ?? false;
      const phrases = data.phrases ?? (data.text?.trim() ? [data.text.trim()] : []);
      if (!en) return true;
      return phrases.filter((p) => p.trim().length > 0).length > 0;
    },
    { message: "При включённой дорожке добавьте хотя бы одну фразу", path: ["phrases"] }
  );

function revalidateMarquee(): void {
  revalidateTag("home-marquee", "max");
  revalidatePath("/");
  revalidatePath("/admin/home");
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("home_reviews")
      .select("marquee_enabled, marquee_text, marquee_link")
      .limit(1)
      .maybeSingle();

    if (error) {
      const isTableMissing =
        error.code === "42P01" ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes("does not exist");
    if (isTableMissing) {
      return NextResponse.json({
        enabled: false,
        phrases: [],
        link: null,
        _tableMissing: true,
      });
    }
    return NextResponse.json({ enabled: false, phrases: [], link: null });
  }

  if (!data) {
    return NextResponse.json({ enabled: false, phrases: [], link: null });
  }

  const phrases = parsePhrasesResponse(data.marquee_text);
  return NextResponse.json({
    enabled: marqueeSettingToBoolean(data.marquee_enabled),
    text: phrases.length > 0 ? phrases.join(" • ") : null,
    phrases,
    link: data.marquee_link ?? null,
  });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/home-marquee GET]", e);
    return NextResponse.json({ enabled: false, text: null, link: null });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Неверный JSON в теле запроса" }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      const msg = first?.message ?? "Неверные данные";
      return NextResponse.json({ error: msg, details: parsed.error.flatten() }, { status: 400 });
    }

    const { enabled, text, phrases: phrasesInput, link } = parsed.data;
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: selectError } = await (supabase as any)
      .from("home_reviews")
      .select("id")
      .limit(1)
      .maybeSingle();

    const isTableMissing =
      selectError &&
      (selectError.code === "42P01" ||
        selectError.message?.includes("Could not find the table") ||
        selectError.message?.includes("does not exist"));

    if (isTableMissing) {
      return NextResponse.json(
        { error: "Таблица home_reviews не создана. Выполните миграции из scripts/migrations/" },
        { status: 500 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (enabled !== undefined) updateData.marquee_enabled = enabled === true;
    if (phrasesInput !== undefined) {
      const filtered = phrasesInput.filter((p) => p.trim().length > 0);
      updateData.marquee_text = filtered.length > 0 ? JSON.stringify(filtered) : null;
    } else if (text !== undefined) {
      updateData.marquee_text = text.trim() || null;
    }
    if (link !== undefined) updateData.marquee_link = link.trim() || null;

    if (existing?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("home_reviews")
        .update(updateData)
        .eq("id", existing.id)
        .select("marquee_enabled, marquee_text, marquee_link")
        .single();

      if (error) {
        console.error("[admin/home-marquee PATCH] Ошибка обновления:", error);
        return NextResponse.json({ error: `Ошибка обновления: ${error.message}` }, { status: 500 });
      }
      revalidateMarquee();
      const phrases = parsePhrasesResponse(data.marquee_text);
      return NextResponse.json({
        enabled: marqueeSettingToBoolean(data.marquee_enabled),
        text: phrases.length > 0 ? phrases.join(" • ") : null,
        phrases,
        link: data.marquee_link ?? null,
      });
    }

    const marqueeText =
      phrasesInput !== undefined
        ? (() => {
            const filtered = phrasesInput.filter((p) => p.trim().length > 0);
            return filtered.length > 0 ? JSON.stringify(filtered) : null;
          })()
        : text?.trim() || null;

    // Нет записи — создаём (как в home-about)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertData, error } = await (supabase as any)
      .from("home_reviews")
      .insert({
        rating_count: 50,
        review2_text: "Прекрасная мастерская цветов...",
        review3_text: "Всем сердцем люблю Flowerna...",
        marquee_enabled: enabled === true,
        marquee_text: marqueeText,
        marquee_link: link?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select("marquee_enabled, marquee_text, marquee_link")
      .single();

    if (error) {
      console.error("[admin/home-marquee PATCH] Ошибка создания:", error);
      return NextResponse.json({ error: `Ошибка создания: ${error.message}` }, { status: 500 });
    }
    revalidateMarquee();
    const phrases = parsePhrasesResponse(insertData.marquee_text);
    return NextResponse.json({
      enabled: marqueeSettingToBoolean(insertData.marquee_enabled),
      text: phrases.length > 0 ? phrases.join(" • ") : null,
      phrases,
      link: insertData.marquee_link ?? null,
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/home-marquee PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
