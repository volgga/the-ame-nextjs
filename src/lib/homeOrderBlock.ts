/**
 * Публичная загрузка контента блока «Форма с заказом» на главной (заголовок, текст, изображение).
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export type HomeOrderBlock = {
  title: string;
  subtitle1: string;
  text: string;
  imageUrl: string | null;
};

const DEFAULT_ORDER_BLOCK: HomeOrderBlock = {
  title: "Заказать букет вашей мечты",
  subtitle1: "",
  text: "Соберём букет вашей мечты и доставим по Сочи уже сегодня. Оставьте заявку на сайте или позвоните нам — мы подберём идеальное сочетание цветов под ваш повод и бюджет.",
  imageUrl: null,
};

async function getHomeOrderBlockUncached(): Promise<HomeOrderBlock> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_ORDER_BLOCK;

  try {
    const { data, error } = await supabase
      .from("home_reviews")
      .select("order_block_title, order_block_subtitle1, order_block_text, order_block_image_url")
      .limit(1)
      .single();

    if (error || !data) return DEFAULT_ORDER_BLOCK;

    return {
      title: data.order_block_title ?? DEFAULT_ORDER_BLOCK.title,
      subtitle1: data.order_block_subtitle1 ?? DEFAULT_ORDER_BLOCK.subtitle1,
      text: data.order_block_text ?? DEFAULT_ORDER_BLOCK.text,
      imageUrl: data.order_block_image_url ?? null,
    };
  } catch {
    return DEFAULT_ORDER_BLOCK;
  }
}

export async function getHomeOrderBlock(): Promise<HomeOrderBlock> {
  return unstable_cache(getHomeOrderBlockUncached, ["home-order-block"], {
    revalidate: 300,
    tags: ["home-order-block"],
  })();
}
