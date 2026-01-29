import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Контакты The Ame в Сочи. Адрес: ул. Пластунская 123А, корпус 2, этаж 2, офис 84. Доставка цветов по Сочи от 45 минут.",
};

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          Контакты
        </h1>
        <p className="text-xl text-[#7e7e7e] mb-8 text-center">
          Свяжитесь с нами
        </p>
        <div className="max-w-2xl mx-auto text-lg text-[#4b4b4b] space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Адрес</h2>
            <p>Сочи, ул. Пластунская 123А, корпус 2, этаж 2, офис 84</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">Доставка</h2>
            <p>
              Доставка цветов по Сочи от 45 минут. Работаем во всех районах:
              Центр, Адлер, Хоста, Сириус, Мацеста, Лоо, Дагомыс и Красная
              Поляна.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
