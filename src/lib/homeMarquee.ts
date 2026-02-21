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
  /** @deprecated Используйте phrases. Оставлено для обратной совместимости. */
  text?: string | null;
  /** Массив фраз для бегущей строки. Между фразами автоматически вставляется • */
  phrases: string[];
  link: string | null;
};

/** @deprecated Используйте MarqueeSettings */
export type HomeMarquee = MarqueeSettings;

const DEFAULT_MARQUEE: MarqueeSettings = {
  enabled: false,
  phrases: [],
  link: null,
};

/** Парсит marquee_text из БД: JSON-массив ["фраза1","фраза2"] или plain string → одна фраза. */
function parsePhrases(raw: string | null | undefined): string[] {
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
      /* fallback to single phrase */
    }
  }
  return [s];
}

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

    const phrases = parsePhrases(data.marquee_text);
    return {
      enabled: marqueeSettingToBoolean(data.marquee_enabled),
      text: phrases.length > 0 ? phrases.join(" • ") : null,
      phrases,
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
