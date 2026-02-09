import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const DEFAULT_FAQ_ITEMS = [
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

const faqItemSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  answer: z.string().min(1),
});

const updateSchema = z.object({
  items: z.array(faqItemSchema).min(1),
});

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("home_reviews").select("faq_items").limit(1).maybeSingle();

    if (error) {
      const isTableMissing =
        error.code === "42P01" ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes("does not exist");

      if (isTableMissing) {
        return NextResponse.json({ items: DEFAULT_FAQ_ITEMS, _tableMissing: true });
      }
      return NextResponse.json({ items: DEFAULT_FAQ_ITEMS });
    }

    if (!data || !data.faq_items) {
      return NextResponse.json({ items: DEFAULT_FAQ_ITEMS });
    }

    try {
      const items = Array.isArray(data.faq_items) ? data.faq_items : [];
      // Валидация структуры
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
      );
      return NextResponse.json({ items: validItems.length > 0 ? validItems : DEFAULT_FAQ_ITEMS });
    } catch {
      return NextResponse.json({ items: DEFAULT_FAQ_ITEMS });
    }
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/home-faq GET]", e);
    return NextResponse.json({ items: DEFAULT_FAQ_ITEMS });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: selectError } = await (supabase as any)
      .from("home_reviews")
      .select("id")
      .limit(1)
      .maybeSingle();

    const isTableMissing =
      selectError &&
      (selectError.code === "42P01" ||
        selectError.message?.includes("Could not find the table") ||
        selectError.message?.includes("does not exist"));

    if (isTableMissing) {
      return NextResponse.json(
        {
          error: "Таблица home_reviews не создана. Выполните миграции из scripts/migrations/",
        },
        { status: 500 }
      );
    }

    if (existing?.id) {
      // Обновляем существующую запись
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("home_reviews")
        .update({
          faq_items: parsed.data.items,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("faq_items")
        .single();
      if (error) {
        console.error("[admin/home-faq PATCH] Ошибка обновления:", error);
        return NextResponse.json({ error: `Ошибка обновления: ${error.message}` }, { status: 500 });
      }
      return NextResponse.json({ items: data.faq_items ?? parsed.data.items });
    } else {
      // Нет записи - создаем новую
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("home_reviews")
        .insert({
          rating_count: 50,
          review2_text:
            "Прекрасная мастерская цветов. Заказываю букеты не первый раз. Все очень стильно, красиво, качественно. Радует глаз и согревает душу. Все, кому я дарю букеты от Flowerna, в восторге! Однозначная рекомендация. Помимо качества и стиля, всегда все четко и вовремя. Что тоже очень и очень важно. Спасибо за то, что дарите красоту и хорошее настроение",
          review3_text:
            "Всем сердцем люблю Flowerna ❤️ Цветочный с особенной, теплой атмосферой 😊 Букеты как произведение искусства, каждый создан с душой и тонким чувством прекрасного 😊 Сервис Flowerna – это высший уровень, такого дружелюбного и молниеносного взаимодействия с клиентом я ранее не встречала 😊 Flowerna, Вы просто разрыв сердца ❤️ Желаю процветания такому крутому бизнесу!!! ❤️",
          faq_items: parsed.data.items,
          updated_at: new Date().toISOString(),
        })
        .select("faq_items")
        .single();
      if (error) {
        console.error("[admin/home-faq PATCH] Ошибка создания:", error);
        return NextResponse.json({ error: `Ошибка создания: ${error.message}` }, { status: 500 });
      }
      return NextResponse.json({ items: data.faq_items ?? parsed.data.items });
    }
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/home-faq PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
