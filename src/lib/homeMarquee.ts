/**
 * Бегущая дорожка (marquee) — единый контракт и публичное чтение настроек.
 * Хранение: таблица home_reviews, колонки marquee_enabled, marquee_text, marquee_link.
 * Чтение: anon Supabase, RLS SELECT для home_reviews.
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

/** Единый тип настроек бегущей дорожки (админка + публичная часть). */
export type MarqueeSettings = {
  enabled: boolean;
  text: string | null;
  link: string | null;
};

/** @deprecated Используйте MarqueeSettings */
export type HomeMarquee = MarqueeSettings;

const DEFAULT_MARQUEE: MarqueeSettings = {
  enabled: false,
  text: null,
  link: null,
};

/** Нормализация значения из БД в boolean (PostgreSQL/драйвер может вернуть строку "t"/"f"). */
export function marqueeSettingToBoolean(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === "string") return v.toLowerCase() === "true" || v === "1";
  return false;
}

function isValidMarqueeRow(
  row: unknown
): row is { marquee_enabled: unknown; marquee_text: string | null; marquee_link: string | null } {
  return typeof row === "object" && row != null && "marquee_enabled" in row;
}

async function getHomeMarqueeUncached(): Promise<MarqueeSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_MARQUEE;

  try {
    const { data, error } = await supabase
      .from("home_reviews")
      .select("marquee_enabled, marquee_text, marquee_link")
      .limit(1)
      .maybeSingle();

    if (error || !data) return DEFAULT_MARQUEE;
    if (!isValidMarqueeRow(data)) return DEFAULT_MARQUEE;

    return {
      enabled: marqueeSettingToBoolean(data.marquee_enabled),
      text: data.marquee_text?.trim() || null,
      link: data.marquee_link?.trim() || null,
    };
  } catch {
    return DEFAULT_MARQUEE;
  }
}

export async function getHomeMarquee(): Promise<MarqueeSettings> {
  return unstable_cache(getHomeMarqueeUncached, ["home-marquee"], {
    revalidate: 300,
    tags: ["home-marquee"],
  })();
}
