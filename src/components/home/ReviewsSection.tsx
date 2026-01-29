/**
 * ReviewsSection (серверный компонент).
 *
 * В оригинале:
 * - отзывы грузятся из Supabase
 * - на мобилке есть карусель с автопрокруткой (через embla)
 *
 * Здесь:
 * - без новых библиотек
 * - делаем простой “скролл-ряд” на мобилке (CSS), а на десктопе — сетка.
 * - данные пока заглушка, позже подключим реальную загрузку.
 */
export function ReviewsSection() {
  const reviews = [
    {
      id: "r1",
      rating: 5,
      comment: "Очень свежие цветы, доставка быстрая. Букет был как на фото!",
      client_name: "Анна",
      date: "2025-10-12",
    },
    {
      id: "r2",
      rating: 5,
      comment: "Красивое оформление и сервис. Спасибо, обязательно вернусь.",
      client_name: "Мария",
      date: "2025-11-03",
    },
    {
      id: "r3",
      rating: 5,
      comment: "Помогли выбрать букет под событие — получилось идеально.",
      client_name: "Алексей",
      date: "2025-12-01",
    },
    {
      id: "r4",
      rating: 5,
      comment: "Упаковка стильная, цветы свежие. Рекомендую.",
      client_name: "Екатерина",
      date: "2026-01-10",
    },
  ];

  const StarRow = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1 mb-4" aria-label={`Оценка: ${rating} из 5`}>
      {Array.from({ length: rating }).map((_, i) => (
        <span key={i} className="text-yellow-400" aria-hidden>
          ★
        </span>
      ))}
    </div>
  );

  const ReviewCard = ({ r }: { r: (typeof reviews)[number] }) => (
    <div className="bg-gradient-card border-0 shadow-soft transition-all duration-300 hover:shadow-elegant rounded-xl p-6">
      <StarRow rating={r.rating} />
      <p className="text-muted-foreground mb-4">{r.comment}</p>
      <div className="flex justify-between items-center">
        <span className="font-semibold">{r.client_name}</span>
        <span className="text-sm text-muted-foreground">
          {new Date(r.date).toLocaleDateString("ru-RU")}
        </span>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-transparent">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Клиенты о нас</h2>

        {/* Мобилка: горизонтальный скролл (без JS) */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-4 snap-x snap-mandatory">
            {reviews.map((r) => (
              <div key={r.id} className="min-w-[80%] snap-start">
                <ReviewCard r={r} />
              </div>
            ))}
          </div>
        </div>

        {/* Десктоп: сетка */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8">
          {reviews.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
      </div>
    </section>
  );
}

