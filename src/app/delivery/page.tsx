import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Доставка",
  description:
    "Доставка цветов по Сочи от 45 минут. Работаем во всех районах: Центр, Адлер, Хоста, Сириус, Мацеста, Лоо, Дагомыс и Красная Поляна.",
};

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center" style={{ color: "#819570" }}>
          Доставка
        </h1>
        <p className="text-xl text-[#7e7e7e] mb-8 text-center">
          Быстрая доставка цветов по всему Сочи
        </p>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Основная информация */}
          <section className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: "#819570" }}>
              Доставка за 45 минут
            </h2>
            <p className="text-lg text-[#4b4b4b] leading-relaxed">
              Закажите доставку цветов в Сочи — мы привезём букет уже через 45 минут.
              Работаем во всех районах города.
            </p>
          </section>

          {/* Районы доставки */}
          <section className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: "#819570" }}>
              Районы доставки
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Основные районы:</h3>
                <ul className="space-y-1 text-[#4b4b4b]">
                  <li>• Центр Сочи</li>
                  <li>• Адлер</li>
                  <li>• Хоста</li>
                  <li>• Сириус, Лоо</li>
                  <li>• Мацеста</li>
                  <li>• Дагомыс</li>
                  <li>• Красная Поляна</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Стоимость доставки:</h3>
                <p className="text-[#4b4b4b]">
                  Стоимость доставки зависит от района и суммы заказа. При заказе от определённой суммы доставка становится бесплатной.
                </p>
                <p className="text-sm text-[#7e7e7e] mt-2">
                  Подробную информацию о стоимости доставки вы можете увидеть при оформлении заказа в корзине.
                </p>
              </div>
            </div>
          </section>

          {/* Условия */}
          <section className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: "#819570" }}>
              Условия доставки
            </h2>
            <div className="space-y-4 text-[#4b4b4b]">
              <div>
                <h3 className="font-semibold mb-2">Время доставки:</h3>
                <p>Доставка осуществляется с 10:00 до 22:00 ежедневно.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Самовывоз:</h3>
                <p>
                  Вы можете забрать заказ самостоятельно по адресу: Пластунская 123а, к2, 2 этаж, 84 офис.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Упаковка:</h3>
                <p>
                  В подарок мы упакуем ваш букет в транспортировочную коробку, добавим рекомендации по уходу, кризал и открытку по желанию.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
