import type { Metadata } from "next";
import { Clock, MapPin, Phone, MessageCircle, Send, Sparkles, Mail, Instagram } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Контакты — доставка цветов в Сочи | The Ame",
  description:
    "Контакты и способы связи с The Ame. Заказ цветов с доставкой по Сочи, адрес, телефон и соцсети.",
  alternates: {
    canonical: canonicalUrl("/contacts"),
  },
  robots: ROBOTS_INDEX_FOLLOW,
};

const YANDEX_MAP_SRC = "https://yandex.ru/map-widget/v1/?z=16&ol=biz&oid=77269998905";

const LINK_CLASS = "text-neutral-700 hover:text-black hover:underline underline-offset-2 transition-colors";

const SECTION_TITLE_CLASS = "text-sm font-medium uppercase tracking-wide text-neutral-700";

const ROW_CLASS = "flex items-center gap-3";
const ICON_CLASS = "h-5 w-5 shrink-0 text-neutral-500";

const CONTACT_LINKS: {
  Icon: LucideIcon;
  label: string;
  href: string;
  text: string;
  external?: boolean;
}[] = [
  {
    Icon: Phone,
    label: "Телефон",
    href: "tel:+79939326095",
    text: "+7 993 932-60-95",
  },
  {
    Icon: MessageCircle,
    label: "What's App",
    href: "https://wa.me/message/XQDDWGSEL35LP1",
    text: "+7 993 932-60-95",
    external: true,
  },
  {
    Icon: Send,
    label: "Telegram",
    href: "https://t.me/the_ame_flowers",
    text: "@the_ame_flowers",
    external: true,
  },
  {
    Icon: Sparkles,
    label: "МАХ",
    href: "https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY",
    text: "+7 993 932-60-95",
    external: true,
  },
  {
    Icon: Mail,
    label: "Email",
    href: "mailto:theame123@mail.ru",
    text: "theame123@mail.ru",
  },
];

const SOCIAL_LINKS: { Icon: LucideIcon; label: string; href: string; text: string }[] = [
  {
    Icon: Instagram,
    label: "Запретграм",
    href: "https://www.instagram.com/theame.flowers",
    text: "theame.flowers",
  },
  {
    Icon: Send,
    label: "Telegram канал",
    href: "https://t.me/theame123",
    text: "@theame123",
  },
];

export default function ContactsPage() {
  return (
    <div className="bg-page-bg">
      <div className="container mx-auto px-5 md:px-6 pt-12 pb-10">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:items-stretch">
          <div className="order-2 h-[320px] w-full overflow-hidden rounded-lg lg:order-1 lg:h-full">
            <iframe
              src={YANDEX_MAP_SRC}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              frameBorder={0}
              title="Яндекс карта — The Ame, Сочи"
            />
          </div>

          <div className="order-1 lg:order-2">
            <h1 className="mb-8 text-3xl font-semibold tracking-tight text-black sm:text-4xl">КОНТАКТЫ THE ÁME</h1>

            <div className="space-y-8 text-base leading-relaxed">
              <section>
                <h2 className={`mb-2 ${SECTION_TITLE_CLASS}`}>Время работы</h2>
                <div className={`${ROW_CLASS} text-neutral-600`}>
                  <Clock className={ICON_CLASS} />
                  <span>Работаем ежедневно с 09:00 до 21:00</span>
                </div>
              </section>

              <section>
                <h2 className={`mb-2 ${SECTION_TITLE_CLASS}`}>Адрес</h2>
                <div className={`${ROW_CLASS} text-neutral-600`}>
                  <MapPin className={ICON_CLASS} />
                  <a
                    href="https://yandex.ru/maps/239/sochi/?from=mapframe&ll=39.732810%2C43.615391&mode=poi&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D77269998905&source=mapframe&utm_source=mapframe&z=19"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK_CLASS}
                  >
                    г. Сочи, ул. Пластунская 123А к2, 2 этаж, 84 офис
                  </a>
                </div>
              </section>

              <section>
                <h2 className={`mb-3 ${SECTION_TITLE_CLASS}`}>Свяжитесь с нами</h2>
                <ul className="space-y-2.5 text-neutral-600">
                  {CONTACT_LINKS.map(({ Icon, label, href, text, external }) => (
                    <li key={label} className={ROW_CLASS}>
                      <Icon className={ICON_CLASS} />
                      <span>
                        {label}:{" "}
                        <a
                          href={href}
                          className={LINK_CLASS}
                          {...(external && {
                            target: "_blank",
                            rel: "noreferrer",
                          })}
                        >
                          {text}
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className={`mb-3 ${SECTION_TITLE_CLASS}`}>Мы в социальных сетях</h2>
                <ul className="space-y-2.5 text-neutral-600">
                  {SOCIAL_LINKS.map(({ Icon, label, href, text }) => (
                    <li key={label} className={ROW_CLASS}>
                      <Icon className={ICON_CLASS} />
                      <span>
                        {label}:{" "}
                        <a href={href} className={LINK_CLASS} target="_blank" rel="noopener noreferrer">
                          {text}
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
