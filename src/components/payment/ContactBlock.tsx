/**
 * Блок "Свяжитесь с нами" для страниц /payment/success и /payment/fail.
 * Заголовок + список контактов (иконка слева, текст справа), те же ссылки что в хедере.
 */
const ICON_SM = "w-5 h-5 block shrink-0 text-color-text-main";

export function PaymentContactBlock() {
  const rowClass =
    "flex items-center gap-3 text-color-text-main text-sm md:text-base hover:opacity-80 transition-opacity";
  return (
    <div>
      <h2 className="font-semibold text-color-text-main text-sm mb-3 uppercase tracking-wide">Свяжитесь с нами</h2>
      <ul className="space-y-2">
        <li>
          <a href="tel:+79939326095" className={rowClass}>
            <svg
              className={ICON_SM}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            <span>
              Телефон: <span className="font-semibold">+7 993 932-60-95</span>
            </span>
          </a>
        </li>
        <li>
          <a href="https://wa.me/message/XQDDWGSEL35LP1" target="_blank" rel="noopener noreferrer" className={rowClass}>
            <svg className={ICON_SM} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <span>
              What&apos;s App: <span className="font-semibold">+7 993 932-60-95</span>
            </span>
          </a>
        </li>
        <li>
          <a href="https://t.me/the_ame_flowers" target="_blank" rel="noopener noreferrer" className={rowClass}>
            <svg className={ICON_SM} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.89 8.905c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.12l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
            </svg>
            <span>
              Telegram: <span className="font-semibold">@the_ame_flowers</span>
            </span>
          </a>
        </li>
        <li>
          <a
            href="https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY"
            target="_blank"
            rel="noopener noreferrer"
            className={rowClass}
          >
            <span
              className={`${ICON_SM} bg-color-text-main`}
              style={{
                WebkitMaskImage: "url(/icons/max4-messenger-color-icon.png)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: "url(/icons/max4-messenger-color-icon.png)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
            <span>
              MAX: <span className="font-semibold">+7 993 932-60-95</span>
            </span>
          </a>
        </li>
        <li>
          <a href="mailto:theame123@mail.ru" className={rowClass}>
            <svg
              className={ICON_SM}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
            <span>
              Email: <span className="font-semibold">theame123@mail.ru</span>
            </span>
          </a>
        </li>
      </ul>
    </div>
  );
}
