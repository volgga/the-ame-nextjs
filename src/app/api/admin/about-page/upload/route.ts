import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "blog";
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
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
      console.error("[admin/about-page/upload] Ошибка парсинга FormData:", e);
      return NextResponse.json({ error: "Ошибка чтения данных формы" }, { status: 400 });
    }
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимум ${MAX_SIZE_BYTES / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const mime = file.type?.toLowerCase();
    if (!mime || !ALLOWED_TYPES.includes(mime)) {
      return NextResponse.json({ error: "Допустимые форматы: JPEG, PNG, WebP, AVIF, GIF" }, { status: 400 });
    }

    const ext = EXT_MAP[mime] ?? "jpg";
    const timestamp = Date.now();
    // Путь: about/cover-${timestamp}.${ext} для обложки страницы "О нас"
    const storagePath = `about/cover-${timestamp}.${ext}`;

    // Проверка переменных окружения перед использованием
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_SUPABASE_URL не задан. Проверьте переменные окружения в .env.local или .env",
        },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: mime,
      upsert: true,
    });

    if (error) {
      console.error("[admin/about-page/upload] Upload error:", JSON.stringify(error, null, 2));
      const errorMessage = error.message || "Ошибка загрузки в Storage";

      // Улучшенная обработка ошибок bucket
      if (
        errorMessage.includes("Bucket not found") ||
        errorMessage.includes("bucket") ||
        errorMessage.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error: `Bucket "${BUCKET}" не найден в Supabase Storage. Создайте публичный bucket "${BUCKET}" в Supabase Dashboard (Storage → New Bucket). Проверьте также переменные окружения: NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Используем getPublicUrl для получения публичного URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: urlData } = (supabase as any).storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    return NextResponse.json({ image_url: publicUrl, path: storagePath });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/about-page/upload POST]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
