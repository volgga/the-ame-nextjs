import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "hero-slides";
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error("[admin/slides/upload] Ошибка парсинга FormData:", e);
      return NextResponse.json({ error: "Ошибка чтения данных формы" }, { status: 400 });
    }
    const file = formData.get("file") as File | null;
    const slideId = formData.get("slideId") as string | null; // optional, for new slides we generate

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      const maxMB = MAX_SIZE_BYTES / 1024 / 1024;
      return NextResponse.json(
        { ok: false, error: `Файл слишком большой. Максимум ${maxMB}MB.`, maxMB },
        { status: 413 }
      );
    }

    const mime = file.type?.toLowerCase();
    if (!mime || !ALLOWED_TYPES.includes(mime)) {
      return NextResponse.json({ error: "Допустимые форматы: JPEG, PNG, WebP, AVIF" }, { status: 400 });
    }

    const ext = EXT_MAP[mime] ?? "jpg";
    const id = slideId ?? crypto.randomUUID();
    const timestamp = Date.now();
    const safeName = `${id}-${timestamp}.${ext}`;
    const storagePath = safeName;

    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Годовой кэш: слайды меняются редко (фото 2 — экономия при повторных визитах)
    const { data, error } = await (supabase as any).storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: mime,
      cacheControl: "public, max-age=31536000, s-maxage=31536000, immutable",
      upsert: true,
    });

    if (error) {
      console.error("[admin/slides/upload]", error);
      return NextResponse.json({ error: error.message ?? "Ошибка загрузки в Storage" }, { status: 500 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
    const publicUrl = `${url}/storage/v1/object/public/${BUCKET}/${data.path}`;

    return NextResponse.json({ image_url: publicUrl, path: data.path });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/slides/upload POST]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
