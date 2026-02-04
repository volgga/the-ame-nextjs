/**
 * Публичная загрузка слайдов для HeroCarousel.
 * Использует anon-клиент. RLS разрешает SELECT только для is_active=true.
 */

import { supabase } from "@/lib/supabaseClient";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  sort_order: number;
  /** Кнопка: показывается только если заданы оба buttonText и buttonHref */
  buttonText?: string | null;
  buttonHref?: string | null;
  buttonVariant?: "filled" | "transparent" | null;
  buttonAlign?: "left" | "center" | "right" | null;
};

export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("id, image_url, sort_order, button_text, button_href, button_variant, button_align")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      if (error.code === "42P01") return []; // таблица не существует
      console.warn("[heroSlides] Ошибка загрузки:", error.message);
      return [];
    }

    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      imageUrl: (r.image_url as string) ?? "",
      sort_order: (r.sort_order as number) ?? 0,
      buttonText: (r.button_text as string | null) ?? null,
      buttonHref: (r.button_href as string | null) ?? null,
      buttonVariant: (r.button_variant as "filled" | "transparent" | null) ?? null,
      buttonAlign: (r.button_align as "left" | "center" | "right" | null) ?? null,
    }));
  } catch {
    return [];
  }
}
