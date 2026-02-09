import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { CLIENT_LINKS } from "@/lib/navLinks";

const FOOTER_LINK = "block text-[#7e7e7e] hover:text-black transition-colors py-0.5";

/**
 * Footer — подвал сайта.
 * Порядок колонок: Лого | Меню | Клиентам | Контакты | Документы
 */
export function Footer() {
  return (
    <footer className="bg-page-bg border-t mt-auto">
      <div className="w-full px-0.5 md:px-8 py-8 md:py-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* 1. Лого: логотип + подпись + копирайт + бейдж Яндекса (ниже копирайта) */}
            <div className="flex flex-col items-start text-left space-y-4 min-w-0">
              <div className="leading-tight" style={{ fontFamily: "Forum, serif" }}>
                <Link href="/" className="block">
                  <span className="text-3xl md:text-4xl font-normal text-black tracking-wide">The Áme</span>
                </Link>
                <div className="text-sm md:text-base font-normal tracking-wide text-black mt-0.5">ЦВЕТЫ × ЧУВСТВА</div>
              </div>
              <p className="text-[#7e7e7e] text-sm">2025–2026 © The Áme</p>
              {/* Бейдж рейтинга Яндекса: ниже копирайта, по левому краю, не растягивать на мобильных */}
              <div className="pt-3 w-full max-w-[150px]">
                <iframe
                  src="https://yandex.ru/sprav/widget/rating-badge/77269998905?type=rating"
                  width="150"
                  height="50"
                  frameBorder="0"
                  title="Рейтинг Яндекса"
                  className="shrink-0 max-w-full"
                />
              </div>
            </div>

            {/* 2. Меню */}
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-black mb-4">Меню</h3>
              <nav className="space-y-2">
                <Link href="/" className={FOOTER_LINK}>
                  Главная
                </Link>
                <Link href="/posmotret-vse-tsvety" className={FOOTER_LINK}>
                  Каталог
                </Link>
                <Link href="/about" className={FOOTER_LINK}>
                  О нас
                </Link>
                <Link href="/contacts" className={FOOTER_LINK}>
                  Контакты
                </Link>
              </nav>
            </div>

            {/* 3. Клиентам */}
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-black mb-4">Клиентам</h3>
              <nav className="space-y-2">
                {CLIENT_LINKS.map(({ href, label }) => (
                  <Link key={href} href={href} className={FOOTER_LINK}>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* 4. Контакты */}
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-black mb-4">Контакты</h3>
              <div className="space-y-3 text-[#7e7e7e] text-sm leading-relaxed">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-black mt-0.5 shrink-0" />
                  <a
                    href="https://yandex.ru/maps/239/sochi/?from=mapframe&ll=39.732810%2C43.615391&mode=poi&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D77269998905&source=mapframe&utm_source=mapframe&z=19"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7e7e7e] hover:text-black transition-colors"
                  >
                    Пластунская 123А, корпус 2, этаж 2, офис 84
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-black shrink-0" />
                  <a href="tel:+79939326095" className="hover:text-black transition-colors">
                    +7 (993) 932-60-95
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-black shrink-0" />
                  <a href="mailto:theame123@mail.ru" className="hover:text-black transition-colors">
                    theame123@mail.ru
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-black mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p>Круглосуточная доставка</p>
                    <p>Прием заказов 9:00 - 21:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Документы */}
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-black mb-4">Документы</h3>
              <nav className="space-y-2">
                <Link href="/docs/oferta" className={FOOTER_LINK}>
                  Договор оферты
                </Link>
                <Link href="/docs/privacy" className={FOOTER_LINK}>
                  Политика конфиденциальности
                </Link>
                <Link href="/marketing-consent" className={FOOTER_LINK}>
                  Согласие на получение рекламных рассылок
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
