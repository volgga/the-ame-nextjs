/**
 * Публичная загрузка настроек секции «Отзывы клиентов» на главной.
 * Использует anon-клиент. RLS разрешает SELECT для всех.
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export type HomeReviews = {
  ratingCount: number;
  review2Text: string;
  review3Text: string;
};

const DEFAULT_REVIEWS: HomeReviews = {
  ratingCount: 50,
  review2Text:
    "Прекрасная мастерская цветов. Заказываю букеты не первый раз. Все очень стильно, красиво, качественно. Радует глаз и согревает душу. Все, кому я дарю букеты от Flowerna, в восторге! Однозначная рекомендация. Помимо качества и стиля, всегда все четко и вовремя. Что тоже очень и очень важно. Спасибо за то, что дарите красоту и хорошее настроение",
  review3Text:
    "Всем сердцем люблю Flowerna ❤️ Цветочный с особенной, теплой атмосферой 😊 Букеты как произведение искусства, каждый создан с душой и тонким чувством прекрасного 😊 Сервис Flowerna – это высший уровень, такого дружелюбного и молниеносного взаимодействия с клиентом я ранее не встречала 😊 Flowerna, Вы просто разрыв сердца ❤️ Желаю процветания такому крутому бизнесу!!! ❤️",
};

async function getHomeReviewsUncached(): Promise<HomeReviews> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_REVIEWS;

  try {
    const { data, error } = await supabase
      .from("home_reviews")
      .select("rating_count, review2_text, review3_text")
      .limit(1)
      .single();

    if (error || !data) return DEFAULT_REVIEWS;

    return {
      ratingCount: data.rating_count ?? DEFAULT_REVIEWS.ratingCount,
      review2Text: data.review2_text ?? DEFAULT_REVIEWS.review2Text,
      review3Text: data.review3_text ?? DEFAULT_REVIEWS.review3Text,
    };
  } catch {
    return DEFAULT_REVIEWS;
  }
}

export async function getHomeReviews(): Promise<HomeReviews> {
  return unstable_cache(getHomeReviewsUncached, ["home-reviews"], { revalidate: 300 })();
}
