import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "product-images";
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB, без сжатия
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимум ${MAX_SIZE_BYTES / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    const mime = file.type?.toLowerCase();
    if (!mime || !ALLOWED_TYPES.includes(mime)) {
      return NextResponse.json({ error: "Допустимые форматы: JPEG, PNG, WebP, AVIF, GIF" }, { status: 400 });
    }

    const ext = EXT_MAP[mime] ?? "jpg";
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const storagePath = `${id}-${timestamp}.${ext}`;

    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- типы Supabase .storage не в дефолтном клиенте
    const { data, error } = await (supabase as any).storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

    if (error) {
      console.error("[admin/products/upload]", error);
      return NextResponse.json({ error: error.message ?? "Ошибка загрузки в Storage" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
    const image_url = `${baseUrl}/storage/v1/object/public/${BUCKET}/${data.path}`;

    return NextResponse.json({ image_url, path: data.path });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : "Ошибка загрузки";
    console.error("[admin/products/upload POST]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
