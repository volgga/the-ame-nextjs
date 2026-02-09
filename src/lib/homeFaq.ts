/**
 * Публичная загрузка настроек секции «Часто задаваемые вопросы» на главной.
 * Использует anon-клиент. RLS разрешает SELECT для всех.
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: "1",
    question: "Как быстро осуществляется доставка цветов по Сочи?",
    answer:
      "Доставка цветов по Сочи осуществляется ежедневно. Вы можете оформить заказ заранее или в день доставки, выбрав удобное время. Минимальное время доставки — от 45 минут.",
  },
  {
    id: "2",
    question: "В какие районы Сочи вы доставляете?",
    answer:
      "Мы доставляем цветы во все основные районы города Сочи. При оформлении заказа вы можете указать точный адрес, и мы подтвердим возможность доставки.",
  },
  {
    id: "3",
    question: "Как оплатить заказ?",
    answer:
      "Мы принимаем различные способы оплаты: наличными при получении, банковской картой онлайн или при получении. Все способы оплаты доступны при оформлении заказа.",
  },
  {
    id: "4",
    question: "Насколько свежие цветы вы используете?",
    answer:
      "Мы работаем только со свежими цветами и создаём букеты, которые сохраняют свежесть как можно дольше. Качество контролируется на всех этапах — от сборки до передачи получателю.",
  },
  {
    id: "5",
    question: "Можно ли добавить открытку к букету?",
    answer:
      "Да, вы можете добавить открытку с личным текстом при оформлении заказа. Мы передадим её вместе с букетом получателю.",
  },
  {
    id: "6",
    question: "Что делать, если цветы не подошли?",
    answer:
      "Если у вас возникли вопросы по качеству или составу букета, пожалуйста, свяжитесь с нами. Мы всегда готовы помочь и решить любую ситуацию.",
  },
  {
    id: "7",
    question: "Можно ли заказать букет заранее?",
    answer:
      "Да, вы можете оформить заказ заранее, выбрав удобную дату и время доставки. Это особенно удобно для важных событий и праздников.",
  },
  {
    id: "8",
    question: "Какие виды букетов вы предлагаете?",
    answer:
      "В нашем каталоге представлены классические и авторские композиции, букеты из роз, монобукеты, цветы в коробке и цветы в корзине. Мы регулярно обновляем ассортимент, следуя современным тенденциям флористики.",
  },
];

async function getHomeFaqUncached(): Promise<FaqItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_FAQ_ITEMS;

  try {
    const { data, error } = await supabase.from("home_reviews").select("faq_items").limit(1).single();

    if (error || !data?.faq_items) return DEFAULT_FAQ_ITEMS;

    const items = Array.isArray(data.faq_items) ? data.faq_items : [];
    const validItems = items.filter(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "question" in item &&
        "answer" in item &&
        typeof (item as { id: string }).id === "string" &&
        typeof (item as { question: string }).question === "string" &&
        typeof (item as { answer: string }).answer === "string"
    ) as FaqItem[];
    return validItems.length > 0 ? validItems : DEFAULT_FAQ_ITEMS;
  } catch {
    return DEFAULT_FAQ_ITEMS;
  }
}

export async function getHomeFaq(): Promise<FaqItem[]> {
  return unstable_cache(getHomeFaqUncached, ["home-faq"], { revalidate: 300 })();
}
