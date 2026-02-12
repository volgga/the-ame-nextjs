import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * Публичный API для получения опций времени доставки для конкретной даты.
 * GET /api/delivery-time-options?date=YYYY-MM-DD
 *
 * Возвращает массив строк с опциями времени:
 * - Всегда первой идет "Доставка ночью"
 * - Если для даты есть кастомные интервалы в админке - они добавляются после
 * - Если кастомных нет - возвращаются стандартные интервалы (10:00-21:00)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json({ error: "Параметр date обязателен" }, { status: 400 });
    }

    // Валидация формата даты
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: "Дата должна быть в формате YYYY-MM-DD" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const options: string[] = ["Доставка ночью"];

    // Пытаемся получить кастомные интервалы для этой даты
    try {
      const { data: day } = await (supabase as any)
        .from("delivery_days")
        .select("id")
        .eq("date", dateParam)
        .maybeSingle();

      if (day) {
        // Есть кастомные интервалы - получаем их
        const { data: slots } = await (supabase as any)
          .from("delivery_time_slots")
          .select("start_time, end_time")
          .eq("day_id", day.id)
          .order("sort_order", { ascending: true });

        if (slots && slots.length > 0) {
          // Добавляем кастомные интервалы в формате "HH:MM-HH:MM"
          const customIntervals = slots.map((slot: { start_time: string; end_time: string }) => {
            return `${slot.start_time}-${slot.end_time}`;
          });
          options.push(...customIntervals);
          return NextResponse.json(options);
        }
      }
    } catch (dbError) {
      // Если таблицы еще не созданы или ошибка БД - fallback на стандартные опции
      console.warn("[delivery-time-options] Ошибка получения кастомных интервалов, используем стандартные:", dbError);
    }

    // Fallback: стандартные интервалы (как в getTimeIntervals)
    const today = new Date();
    const selectedDate = new Date(dateParam);
    const isToday = selectedDate.toDateString() === today.toDateString();
    const now = new Date();
    const currentHour = now.getHours();

    for (let hour = 10; hour <= 21; hour++) {
      if (isToday && hour <= currentHour) continue;
      options.push(`${hour}:00-${hour + 1}:00`);
    }

    return NextResponse.json(options);
  } catch (e) {
    console.error("[delivery-time-options GET]", e);
    // В случае ошибки возвращаем хотя бы стандартные опции
    const fallbackOptions: string[] = ["Доставка ночью"];
    const today = new Date();
    const now = new Date();
    const currentHour = now.getHours();
    for (let hour = 10; hour <= 21; hour++) {
      if (hour <= currentHour) continue;
      fallbackOptions.push(`${hour}:00-${hour + 1}:00`);
    }
    return NextResponse.json(fallbackOptions);
  }
}
