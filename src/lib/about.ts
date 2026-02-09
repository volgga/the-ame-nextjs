/**
 * About Page: загрузка данных страницы "О нас" из Supabase (таблица about_page).
 */

import { getSupabaseServer } from "@/lib/supabaseServer";

export type AboutPage = {
  id: number;
  title: string | null;
  content: string;
  cover_image_path: string | null;
  cover_image_url: string | null;
  cover_alt: string | null;
  cover_caption: string | null;
  updated_at: string;
};

/**
 * Получить данные страницы "О нас" (публичная функция)
 */
export async function getAboutPage(): Promise<AboutPage | null> {
  try {
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("about_page").select("*").eq("id", 1).single();

    if (error) {
      if (error.code === "PGRST116") {
        // Запись не найдена, возвращаем null
        return null;
      }
      if (process.env.NODE_ENV === "development") {
        console.error("[lib/about getAboutPage]", error);
      }
      return null;
    }

    const page = data as AboutPage;

    // Если есть cover_image_path, но нет cover_image_url, получаем публичный URL
    if (page.cover_image_path && !page.cover_image_url) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: urlData } = (supabase as any).storage.from("blog").getPublicUrl(page.cover_image_path);
      page.cover_image_url = urlData.publicUrl;
    }

    return page;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[lib/about getAboutPage]", e);
    }
    return null;
  }
}
