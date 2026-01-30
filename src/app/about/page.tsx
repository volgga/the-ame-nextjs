import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flower, Users, Heart, Award, Clock, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "The Ame — уютный цветочный магазин в Сочи, где цветы подбирают с душой. Премиальные букеты и авторские композиции.",
};

export default function AboutPage() {
  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Любовь к цветам",
      description: "Каждый букет создается с любовью и вниманием к деталям",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Качество",
      description: "Используем только свежие цветы от проверенных поставщиков",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Клиентоориентированность",
      description: "Всегда ставим потребности клиентов на первое место",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Пунктуальность",
      description: "Доставляем точно в срок, чтобы не испортить важный момент",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-[#819570]">
            The Áme
          </h1>
          <p className="text-base sm:text-lg max-w-3xl mx-auto text-[#819570]">
            Цветы говорят за нас. Мы создаём настроение и превращаем моменты в нечто большее.
          </p>
        </div>
      </section>

      {/* О нас */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-[#819570]">
                О нас
              </h2>

              <p className="text-lg mb-6 text-[#819570]">
                В The Áme мы вдохновляемся французской эстетикой и ценим в цветах не только красоту, но и смысл.
                Каждая композиция — это продуманный образ, где важна каждая деталь: форма, оттенок, подача.
              </p>
              <p className="text-lg mb-6 text-[#819570]">
                Мы работаем с душой, подбираем только свежие, выразительные цветы и создаём букеты, которые
                не просто украшают — они говорят за вас.
              </p>

              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="px-4 py-2 rounded-full border-[#819570] text-[#819570]">
                  <Award className="w-4 h-4 mr-2" />
                  5 звёзд оценка
                </Badge>
                <Badge variant="outline" className="px-4 py-2 rounded-full border-[#819570] text-[#819570]">
                  <Clock className="w-4 h-4 mr-2" />
                  24/7 Поддержка клиентов
                </Badge>
                <Badge variant="outline" className="px-4 py-2 rounded-full border-[#819570] text-[#819570]">
                  <Flower className="w-4 h-4 mr-2" />
                  50+ видов цветов
                </Badge>
                <Badge variant="outline" className="px-4 py-2 rounded-full border-[#819570] text-[#819570]">
                  <Truck className="w-4 h-4 mr-2" />
                  Быстрая доставка
                </Badge>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "⭐⭐⭐⭐⭐", subtitle: "5 звёзд оценка" },
                { title: "500+", subtitle: "Созданных букетов" },
                { title: "50+", subtitle: "Видов цветов" },
                { title: "24/7", subtitle: "Поддержка клиентов" },
              ].map((item) => (
                <Card key={item.title} className="border-0 shadow-sm rounded-xl bg-white/60">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-2xl font-bold mb-1 text-[#819570]">{item.title}</h3>
                    <p className="text-sm text-[#819570]">{item.subtitle}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ценности */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-[#819570]">
              Наши ценности
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-[#819570]">
              Принципы, которые лежат в основе нашей работы и помогают создавать незабываемые моменты.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <Card
                key={idx}
                className="border-0 shadow-sm rounded-xl bg-white/60 transition-transform duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center text-[#819570]">{value.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-[#819570]">{value.title}</h3>
                  <p className="text-[#819570]">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
