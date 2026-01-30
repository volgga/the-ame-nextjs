import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

/**
 * Footer компонент по структуре оригинала
 */
export function Footer() {
  // Статический список категорий (как в CategoryNav)
  const categories = [
    { name: "Авторские букеты", slug: "avtorskie-bukety" },
    { name: "Монобукеты", slug: "monobukety" },
    { name: "Цветы в корзине/коробке", slug: "tsvety-v-korzine-korobke" },
    { name: "Премиум", slug: "premium" },
    { name: "Розы", slug: "rozy" },
    { name: "Подарки", slug: "podarki" },
    { name: "Вазы", slug: "vazy" },
  ];

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* 4 колонки на десктопе */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* ЛОГО + СЛОГАН */}
          <div className="flex flex-col items-start text-left space-y-3">
            <div className="leading-tight" style={{ fontFamily: "Forum, serif" }}>
              <Link href="/" className="block">
                <span className="text-3xl md:text-4xl font-normal text-black tracking-wide">
                  The Áme
                </span>
              </Link>
              <div className="text-sm md:text-base font-normal tracking-wide text-black">
                ЦВЕТЫ х ЧУВСТВА
              </div>
            </div>

            <p className="text-[#7e7e7e] max-w-md">
              Премиальные букеты из Сочи, вдохновлённые французской эстетикой.
              Дарим не просто цветы — передаём чувства, стиль и настроение.
            </p>

            {/* Копирайт под описанием */}
            <p className="text-[#7e7e7e] text-sm">2025-2026 © The Áme</p>
          </div>

          {/* НАВИГАЦИЯ */}
          <div>
            <h3 className="text-lg font-semibold text-[#7e7e7e] mb-4">Навигация</h3>
            <nav className="space-y-2">
              <Link href="/" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Главная
              </Link>
              <Link href="/catalog" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Каталог
              </Link>
              <Link href="/about" className="block text-[#7e7e7e] hover:text-black transition-colors">
                О нас
              </Link>
              <Link href="/contacts" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Контакты
              </Link>
              <Link href="/cart" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Корзина
              </Link>
              <Link href="/delivery-and-payments" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Доставка и оплата
              </Link>
            </nav>
          </div>

          {/* МАГАЗИН (категории из хедера) */}
          <div>
            <h3 className="text-lg font-semibold text-[#7e7e7e] mb-4">Магазин</h3>
            <nav className="space-y-2">
              <Link href="/catalog" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Каталог
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog?category=${cat.slug}`}
                  className="block text-[#7e7e7e] hover:text-black transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* КОНТАКТЫ */}
          <div>
            <h3 className="text-lg font-semibold text-[#7e7e7e] mb-4">Контакты</h3>
            <div className="space-y-3 text-[#7e7e7e]">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-black mt-0.5" />
                <div>
                  <p>Пластунская 123А, корпус 2, этаж 2, офис 84</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-black" />
                <a href="tel:+79939326095" className="hover:text-black transition-colors">
                  +7 (993) 932-60-95
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-black" />
                <a href="mailto:theame123@mail.ru" className="hover:text-black transition-colors">
                  theame123@mail.ru
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-black mt-0.5" />
                <div>
                  <p>Пн-Вс: 9:00 - 21:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
