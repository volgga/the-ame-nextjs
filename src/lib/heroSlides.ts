/**
 * Публичная загрузка слайдов для HeroCarousel.
 * Использует anon-клиент. RLS разрешает SELECT только для is_active=true.
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  sort_order: number;
  /** Варианты изображения для оптимизации */
  imageThumbUrl?: string | null;
  imageMediumUrl?: string | null;
  imageLargeUrl?: string | null;
  imageThumbAvifUrl?: string | null;
  imageMediumAvifUrl?: string | null;
  imageLargeAvifUrl?: string | null;
  /** Кнопка: показывается только если заданы оба buttonText и buttonHref */
  buttonText?: string | null;
  buttonHref?: string | null;
  buttonVariant?: "filled" | "transparent" | null;
  buttonAlign?: "left" | "center" | "right" | null;
};

async function getActiveHeroSlidesUncached(): Promise<HeroSlide[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const { data, error } = await supabase
      .from("hero_slides")
      .select(
        "id, image_url, image_thumb_url, image_medium_url, image_large_url, image_thumb_avif_url, image_medium_avif_url, image_large_avif_url, sort_order, button_text, button_href, button_variant, button_align"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) return [];

    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      imageUrl: (r.image_url as string) ?? "",
      sort_order: (r.sort_order as number) ?? 0,
      imageThumbUrl: (r.image_thumb_url as string | null) ?? null,
      imageMediumUrl: (r.image_medium_url as string | null) ?? null,
      imageLargeUrl: (r.image_large_url as string | null) ?? null,
      imageThumbAvifUrl: (r.image_thumb_avif_url as string | null) ?? null,
      imageMediumAvifUrl: (r.image_medium_avif_url as string | null) ?? null,
      imageLargeAvifUrl: (r.image_large_avif_url as string | null) ?? null,
      buttonText: (r.button_text as string | null) ?? null,
      buttonHref: (r.button_href as string | null) ?? null,
      buttonVariant: (r.button_variant as "filled" | "transparent" | null) ?? null,
      buttonAlign: (r.button_align as "left" | "center" | "right" | null) ?? null,
    }));
  } catch {
    return [];
  }
}

/** Кэш 5 мин — слайды меняются редко */
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  return unstable_cache(getActiveHeroSlidesUncached, ["hero-slides"], {
    revalidate: 300,
    tags: ["hero-slides"],
  })();
}
