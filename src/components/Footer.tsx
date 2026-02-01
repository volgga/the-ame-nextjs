import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const FOOTER_LINK = "block text-[#7e7e7e] hover:text-black transition-colors py-0.5";

/**
 * Footer — подвал сайта.
 * Порядок колонок: Лого | Меню | Клиентам | Контакты | Документы
 */
export function Footer() {
  return (
    <footer className="bg-page-bg border-t mt-auto">
      <div className="w-full px-4 md:px-6 lg:px-8 py-8 md:py-10">
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
              <Link href="/delivery-and-payments" className={FOOTER_LINK}>
                Доставка и оплата
              </Link>
              <Link href="/docs/return" className={FOOTER_LINK}>
                Условия возврата
              </Link>
              <Link href="/docs/care" className={FOOTER_LINK}>
                Инструкция по уходу
              </Link>
            </nav>
          </div>

          {/* 4. Контакты */}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-black mb-4">Контакты</h3>
            <div className="space-y-3 text-[#7e7e7e] text-sm leading-relaxed">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-black mt-0.5 shrink-0" />
                <span>Пластунская 123А, корпус 2, этаж 2, офис 84</span>
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
    </footer>
  );
}
