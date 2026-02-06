/**
 * Публичная загрузка настроек секции «О нас» на главной.
 * Использует anon-клиент. RLS разрешает SELECT для всех.
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export type HomeAbout = {
  title: string;
  text: string;
  imageUrl: string | null;
};

const DEFAULT_ABOUT: HomeAbout = {
  title: "О нас",
  text: `Цветочный магазин «THE AME»

Цветочный магазин «THE AME» предлагает доставку цветов в Сочи и удобный онлайн-заказ букетов для любого повода. У нас вы можете купить цветы в Сочи с быстрой доставкой — домой, в офис, отель или ресторан. Мы работаем только с свежими цветами и создаём букеты, которые радуют внешним видом и сохраняют свежесть как можно дольше.

В каталоге «THE AME» представлены букеты цветов на любой вкус: классические и авторские композиции, букеты из роз, монобукеты, цветы в коробке и цветы в корзине. Наши флористы внимательно подбирают каждый элемент композиции, учитывая стиль, повод и ваши пожелания. Мы следим за современными тенденциями флористики и регулярно обновляем ассортимент, чтобы вы могли заказать актуальные и стильные букеты.

Доставка цветов по Сочи осуществляется ежедневно и охватывает все основные районы города. Вы можете оформить заказ заранее или в день доставки, выбрать удобное время и добавить открытку с личным текстом. Мы бережно упаковываем каждый букет и контролируем качество на всех этапах — от сборки до передачи получателю.

Цветы с доставкой в Сочи от «THE AME» — это удобный способ поздравить близких, выразить чувства или сделать приятный сюрприз. Закажите букет онлайн и доверьте заботу о деталях профессиональной команде цветочного магазина «THE AME».`,
  imageUrl: null,
};

async function getHomeAboutUncached(): Promise<HomeAbout> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_ABOUT;

  try {
    const { data, error } = await supabase
      .from("home_reviews")
      .select("about_title, about_text, about_image_url")
      .limit(1)
      .single();

    if (error || !data) return DEFAULT_ABOUT;

    return {
      title: data.about_title ?? DEFAULT_ABOUT.title,
      text: data.about_text ?? DEFAULT_ABOUT.text,
      imageUrl: data.about_image_url ?? null,
    };
  } catch {
    return DEFAULT_ABOUT;
  }
}

export async function getHomeAbout(): Promise<HomeAbout> {
  return unstable_cache(getHomeAboutUncached, ["home-about"], { revalidate: 300 })();
}
