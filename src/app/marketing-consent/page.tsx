import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Согласие на получение рекламных сообщений | The Áme",
  description: "Согласие на получение рекламно-информационных сообщений The Áme. Условия рассылки и отзыва согласия.",
  alternates: {
    canonical: "https://theame.ru/marketing-consent",
  },
};

export default function MarketingConsentPage() {
  return (
    <div className="min-h-screen bg-page-bg">
      <article className="container mx-auto px-5 md:px-6 py-10 md:py-12 max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-color-text-main mb-5 md:mb-6">
          Согласие на получение рекламно-информационных сообщений The Áme
        </h1>

        <div className="space-y-4 text-base md:text-lg text-color-text-main leading-relaxed mb-8 md:mb-10">
          <p>
            Я, являясь субъектом персональных данных, свободно, своей волей и в своём интересе даю согласие
            Индивидуальному предпринимателю Волгину Александру Александровичу (ИНН 741514757204, ОГРНИП 325745600059155)
            на получение рекламных и информационных сообщений по следующим каналам связи:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>электронная почта (email)</li>
            <li>SMS-сообщения</li>
            <li>мессенджеры (включая WhatsApp, Telegram, MAX)</li>
            <li>push-уведомления (при использовании приложений или web-push)</li>
          </ul>
        </div>

        {/* 1. Цели рассылки */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-color-text-main mb-4">1. Цели рассылки</h2>
          <div className="space-y-4 text-base md:text-lg text-color-text-main leading-relaxed">
            <p>Сообщения направляются для:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>информирования о специальных предложениях и скидках</li>
              <li>поздравления с праздниками</li>
              <li>предоставления персональных подборок и рекомендаций</li>
              <li>уведомления о новых продуктах, услугах и коллекциях</li>
              <li>приглашения к участию в мероприятиях и программах лояльности</li>
            </ul>
          </div>
        </section>

        {/* 2. Характер сообщений */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-color-text-main mb-4">2. Характер сообщений</h2>
          <div className="space-y-4 text-base md:text-lg text-color-text-main leading-relaxed">
            <p>Рекламная рассылка не включает сервисные уведомления, необходимые для исполнения заказа:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>уведомления о статусе заказа</li>
              <li>согласование деталей доставки</li>
              <li>отчёт о вручении</li>
            </ul>
          </div>
        </section>

        {/* 3. Порядок отзыва согласия */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-color-text-main mb-4">3. Порядок отзыва согласия</h2>
          <div className="space-y-4 text-base md:text-lg text-color-text-main leading-relaxed">
            <p>Я уведомлён(а), что могу в любой момент отказаться от получения рекламных сообщений:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>по ссылке «Отписаться» в письме</li>
              <li>ответным сообщением в мессенджере</li>
              <li>
                направив запрос на e-mail:{" "}
                <a href="mailto:theame123@mail.ru" className="text-color-text-main underline hover:no-underline">
                  theame123@mail.ru
                </a>
              </li>
              <li>либо иным удобным способом</li>
            </ul>
            <p>Отказ от рекламной рассылки:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>не влияет на возможность оформления и исполнения заказа</li>
              <li>
                не отменяет согласия на обработку персональных данных в иных целях (оформление, доставка, поддержка)
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Правовые основания обработки */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-color-text-main mb-4">4. Правовые основания обработки</h2>
          <div className="space-y-4 text-base md:text-lg text-color-text-main leading-relaxed">
            <p>Обработка моих данных в целях рекламной рассылки осуществляется на основании:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>настоящего согласия</li>
              <li>ст. 18 Федерального закона «О рекламе»</li>
              <li>ст. 6 Федерального закона №152-ФЗ «О персональных данных»</li>
            </ul>
          </div>
        </section>

        {/* 5. Фиксация согласия */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-color-text-main mb-4">5. Фиксация согласия</h2>
          <div className="space-y-4 text-base md:text-lg text-color-text-main leading-relaxed">
            <p>Дата и факт предоставления согласия фиксируются автоматически:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>при установке чекбокса на сайте</li>
              <li>при оформлении подписки</li>
              <li>при подтверждении согласия в мессенджере («Да», «Хочу получать», «Отправляйте» и т.п.)</li>
            </ul>
            <p>
              Сообщения Пользователя в WhatsApp / Telegram / MAX считаются предоставлением согласия в письменной форме.
            </p>
          </div>
        </section>

        {/* 6. Ознакомление с Политикой */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-color-text-main mb-4">6. Ознакомление с Политикой</h2>
          <p className="text-base md:text-lg text-color-text-main leading-relaxed">
            Я подтверждаю, что ознакомился(лась) с Политикой конфиденциальности, размещённой на сайте:{" "}
            <Link
              href="https://theame.ru/privacy-policy"
              className="text-color-text-main underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://theame.ru/privacy-policy
            </Link>
          </p>
        </section>

        <p className="text-sm md:text-base text-[#7e7e7e] mt-8">Дата последнего обновления: 01.02.2026</p>
      </article>
    </div>
  );
}
