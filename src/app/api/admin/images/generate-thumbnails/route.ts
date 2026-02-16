/**
 * API endpoint для генерации превью изображений
 * POST /api/admin/images/generate-thumbnails
 * 
 * Генерирует thumb, medium, large версии в форматах WebP и AVIF
 * и загружает их в Supabase Storage
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateImageVariants, uploadVariantsToStorage, extractStoragePath } from "@/lib/imageGeneration";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Создаем клиент с service role для доступа к Storage
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, storagePath, bucket = "products" } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    if (!storagePath) {
      return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
    }

    // Генерируем варианты
    console.log(`Generating variants for: ${imageUrl}`);
    const variants = await generateImageVariants(imageUrl, {
      skipAvifIfLargerPercent: 20,
    });

    // Загружаем в Storage
    const uploadedUrls = await uploadVariantsToStorage(
      variants,
      storagePath,
      bucket,
      supabaseAdmin
    );

    return NextResponse.json({
      success: true,
      variants: uploadedUrls,
    });
  } catch (error: any) {
    console.error("Error generating thumbnails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate thumbnails" },
      { status: 500 }
    );
  }
}
