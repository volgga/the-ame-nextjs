/**
 * Corporate page: данные страницы «Корпоративные заказы» из Supabase (corporate_page_settings).
 */

import { unstable_cache } from "next/cache";
import { getSupabaseServer } from "@/lib/supabaseServer";

export type CorporatePageSettings = {
  id: number;
  title: string | null;
  text: string | null;
  images: string[];
  max_link: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

const DEFAULT_TITLE = "Оформление мероприятий";
const DEFAULT_TEXT =
  "Команда The Ame с любовью оформит ваш фасад, входную группу или мероприятие под ключ, поможет создать вау-эффект и повысить узнаваемость вашего бизнеса, отразив его ценности и настроение!";
const DEFAULT_SEO_TITLE = "Оформление мероприятий от цветочной студии The Ame в Сочи";
const DEFAULT_SEO_DESCRIPTION =
  "Команда The Ame с любовью оформит ваш фасад, входную группу или мероприятие под ключ, поможет создать вау-эффект и повысить узнаваемость вашего бизнеса, отразив его ценности и настроение!";

async function getCorporatePageUncached(): Promise<CorporatePageSettings | null> {
  try {
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("corporate_page_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      if (process.env.NODE_ENV === "development") {
        console.error("[lib/corporatePage getCorporatePage]", error);
      }
      return null;
    }

    const raw = data as {
      id: number;
      title: string | null;
      text: string | null;
      images: unknown;
      max_link: string | null;
      seo_title: string | null;
      seo_description: string | null;
      updated_at: string;
    };
    const images = Array.isArray(raw.images) ? raw.images.filter((u): u is string => typeof u === "string") : [];
    return {
      ...raw,
      images,
    };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[lib/corporatePage getCorporatePage]", e);
    }
    return null;
  }
}

export async function getCorporatePage(): Promise<CorporatePageSettings | null> {
  return unstable_cache(getCorporatePageUncached, ["corporate-page"], {
    revalidate: 300,
    tags: ["corporate-page"],
  })();
}

export function getCorporatePageDefaults(): Pick<
  CorporatePageSettings,
  "title" | "text" | "seo_title" | "seo_description"
> {
  return {
    title: DEFAULT_TITLE,
    text: DEFAULT_TEXT,
    seo_title: DEFAULT_SEO_TITLE,
    seo_description: DEFAULT_SEO_DESCRIPTION,
  };
}
