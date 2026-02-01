import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Package, Truck, CreditCard, Wallet, Banknote, FileText, Sprout, Droplets, Heart, Gift, Camera, Video, GiftIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Доставка и оплата — условия и способы | The Ame",
  description:
    "Условия доставки цветов по Сочи, стоимость доставки по районам и способы оплаты. Круглосуточная доставка от 60 до 120 минут.",
  keywords: [
    "доставка цветов Сочи",
    "доставка букетов",
    "способы оплаты",
    "стоимость доставки",
    "круглосуточная доставка",
  ],
  alternates: {
    canonical: "https://theame.ru/delivery-and-payments",
  },
};

export default function DeliveryAndPaymentsPage() {
  const deliveries = [
    { area: "Центр Сочи", freeFrom: 4000, price: 300 },
    { area: "Дагомыс, Мацеста", freeFrom: 5000, price: 500 },
    { area: "Хоста", freeFrom: 7000, price: 700 },
    { area: "Адлер", freeFrom: 9000, price: 900 },
    { area: "Сириус, Лоо", freeFrom: 12000, price: 1200 },
    { area: "п. Красная поляна", freeFrom: 18000, price: 1800 },
    { area: "п. Эсто-Садок", freeFrom: 20000, price: 2000 },
    { area: "п. Роза-Хутор", freeFrom: 22000, price: 2200 },
    { area: "На высоту 960м (Роза-Хутор/Горки город)", freeFrom: 24000, price: 2400 },
  ];

  const paymentMethods = [
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Банковской картой",
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Электронными деньгами",
    },
    {
      icon: <Banknote className="w-8 h-8" />,
      title: "Наличными при самовывозе",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Перевод на расчётный счёт юр. лица",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-3 text-[#000] uppercase tracking-tight">
            Доставка и оплата
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16 md:pb-20">
        {/* Блок 1: Условия доставки */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-[#000] uppercase tracking-tight text-center">
            Условия доставки
          </h2>

          <div className="space-y-4 md:space-y-5 max-w-4xl mx-auto">
            {/* Первый абзац без иконки */}
            <p className="text-base md:text-lg text-[#000] leading-relaxed text-left">
              Приём заказов с 09:00 до 21:00.
            </p>

            {/* Второй абзац с иконкой часов */}
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="flex-shrink-0 mt-1">
                <Clock className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base md:text-lg text-[#000] leading-relaxed">
                  Круглосуточная доставка осуществляется при оформлении заказа с 09:00 до 21:00 текущего дня. Стоимость доставки в ночное время осуществляется по двойному тарифу.
                </p>
              </div>
            </div>

            {/* Третий абзац с иконкой грузовика */}
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="flex-shrink-0 mt-1">
                <Truck className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base md:text-lg text-[#000] leading-relaxed">
                  Мы доставляем готовый букет от 60 минут с момента оформления заказа. Доставка осуществляется по всему Большому Сочи.
                </p>
              </div>
            </div>

            {/* Четвёртый абзац с иконкой подарка */}
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="flex-shrink-0 mt-1">
                <Package className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base md:text-lg text-[#000] leading-relaxed">
                  Сделаем всё возможное, чтобы передать букет лично в руки. Согласуем удобное время и место с получателем. Исключение — пожелания получателя или режимные объекты.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Блок 2: Что прилагается к заказу */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-[#000] uppercase tracking-tight text-center">
            Что прилагается к заказу
          </h2>

          <div className="max-w-4xl mx-auto">
            <p className="text-base md:text-lg text-[#000] leading-relaxed mb-4 text-left">
              К каждому букету/корзине/коробке с цветами мы прикладываем:
            </p>
            <div className="space-y-4 md:space-y-5">
              <div className="flex gap-4 md:gap-6 items-center">
                <div className="flex-shrink-0">
                  <Sprout className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base md:text-lg text-[#000] leading-relaxed">
                    Инструкцию по уходу за цветами
                  </p>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 items-center">
                <div className="flex-shrink-0">
                  <Droplets className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base md:text-lg text-[#000] leading-relaxed">
                    Средство для продления жизни букета (кризал)
                  </p>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 items-center">
                <div className="flex-shrink-0">
                  <Heart className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base md:text-lg text-[#000] leading-relaxed">
                    Карточку для ваших слов и пожеланий (по согласованию)
                  </p>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 items-center">
                <div className="flex-shrink-0">
                  <Gift className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base md:text-lg text-[#000] leading-relaxed">
                    Авторскую открытку, сувенир, любимую игрушку, конфеты (по согласованию)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Блок 3: Опции перед отправкой */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-[#000] uppercase tracking-tight text-center">
            Опции перед отправкой
          </h2>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-4 md:space-y-5">
              <div className="flex gap-4 md:gap-6 items-center">
                <div className="flex-shrink-0">
                  <Camera className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base md:text-lg text-[#000] leading-relaxed">
                    Вышлем фото букета перед отправкой для согласования
                  </p>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 items-center">
                <div className="flex-shrink-0">
                  <Video className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base md:text-lg text-[#000] leading-relaxed">
                    При необходимости снимаем видео перед отправкой
                  </p>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 items-center">
                <div className="flex-shrink-0">
                  <GiftIcon className="w-6 h-6 md:w-7 md:h-7 text-color-text-main" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base md:text-lg text-[#000] leading-relaxed">
                    По запросу приложим любой подарок по вашему выбору
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Блок 4: Стоимость доставки по районам Сочи */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-[#000] uppercase tracking-tight text-center">
            Стоимость доставки по районам Сочи
          </h2>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6 md:p-8">
              <div className="divide-y divide-[#eaeaea]">
                {deliveries.map((d, i) => (
                  <div
                    key={i}
                    className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div className="text-base md:text-lg text-[#000] font-medium">
                      {d.area}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm md:text-base">
                      <div className="text-[#7e7e7e]">
                        до {d.freeFrom.toLocaleString("ru-RU")} ₽ —{" "}
                        <span className="text-[#000] font-medium">{d.price} ₽</span>
                      </div>
                      <div className="text-[#7e7e7e] sm:ml-4">
                        от {d.freeFrom.toLocaleString("ru-RU")} ₽ —{" "}
                        <span className="text-[#000] font-medium">Бесплатно</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

                <p className="mt-6 text-sm md:text-base text-[#7e7e7e] text-left">
                  Доставка работает круглосуточно. Стоимость доставки с 22:00 до 09:00 осуществляется по двойному тарифу.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Блок 5: Способы оплаты */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-[#000] uppercase tracking-tight text-center">
            Способы оплаты
          </h2>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {paymentMethods.map((method, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center space-y-4"
                >
                  {/* Иконка в круге */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#F5F2EE] flex items-center justify-center">
                    <div className="text-color-text-main">{method.icon}</div>
                  </div>
                  {/* Текст */}
                  <p className="text-sm md:text-base text-[#000] leading-relaxed">
                    {method.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
