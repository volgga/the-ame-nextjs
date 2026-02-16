import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "blog";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"];
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
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
      console.error("[admin/categories/upload] Ошибка парсинга FormData:", e);
      return NextResponse.json({ error: "Ошибка чтения данных формы" }, { status: 400 });
    }
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      const maxMB = MAX_SIZE_BYTES / 1024 / 1024;
      return NextResponse.json(
        { error: `Файл слишком большой. Максимум ${maxMB}MB.` },
        { status: 413 }
      );
    }

    const mime = file.type?.toLowerCase();
    if (!mime || !ALLOWED_TYPES.includes(mime)) {
      return NextResponse.json({ error: "Допустимые форматы: JPEG, PNG, WebP, AVIF, GIF" }, { status: 400 });
    }

    const ext = EXT_MAP[mime] ?? "jpg";
    const timestamp = Date.now();
    const storagePath = `categories/info-${timestamp}.${ext}`;

    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: mime,
      upsert: true,
    });

    if (error) {
      console.error("[admin/categories/upload]", error);
      return NextResponse.json({ error: error.message ?? "Ошибка загрузки в Storage" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: urlData } = (supabase as any).storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    return NextResponse.json({ image_url: publicUrl, path: data.path });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/categories/upload POST]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
