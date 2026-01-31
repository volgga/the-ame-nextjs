"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import type { OrderCustomerPayload } from "@/types/order";

/** Кнопка «Оплатить»: создаёт заказ на сервере (сумма пересчитывается по каталогу), инициирует платёж Tinkoff, редирект на страницу оплаты. */
function PayButton({
  disabled,
  items,
  customer,
}: {
  disabled: boolean;
  items: { id: string; quantity: number }[];
  customer: OrderCustomerPayload;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (items.length === 0) {
      setError("Корзина пуста");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        setError(orderData.error ?? "Ошибка создания заказа");
        setLoading(false);
        return;
      }
      const initRes = await fetch("/api/payments/tinkoff/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.orderId }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData.paymentUrl) {
        setError(initData.error ?? "Ошибка инициализации платежа");
        setLoading(false);
        return;
      }
      window.location.href = initData.paymentUrl;
      return;
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  };

  return (
    <>
      {error && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handlePay}
        disabled={disabled || loading}
        className="w-full py-4 mt-6 rounded-lg font-semibold text-white uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: "#819570" }}
      >
        {loading ? "Подготовка…" : "ПЕРЕЙТИ К ОПЛАТЕ"}
      </button>
    </>
  );
}

/**
 * CheckoutFormModal — форма оформления заказа внутри модалки.
 * Упрощённая версия без валидации и отправки (пока).
 */
export function CheckoutFormModal() {
  const { state } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+7 (");
  const [customerTelegram, setCustomerTelegram] = useState("");
  const [isRecipientSelf, setIsRecipientSelf] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("+7 (");
  const [deliveryType, setDeliveryType] = useState<string | null>(null);
  const [isPickup, setIsPickup] = useState(false);
  const [isDeliveryDropdownOpen, setIsDeliveryDropdownOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [cardText, setCardText] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [agreeNewsletter, setAgreeNewsletter] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [rememberContacts, setRememberContacts] = useState(true);
  // Чекбоксы для "Получатель другой человек"
  const [askRecipientForDetails, setAskRecipientForDetails] = useState(false);
  const [deliverAnonymously, setDeliverAnonymously] = useState(false);

  // Данные районов доставки строго по скриншоту (9 зон; самовывоза в списке нет)
  const deliveryZones = [
    { id: "center", name: "Центр Сочи", feeUnder: 300, freeFrom: 4000 },
    { id: "dagomys_matsesta", name: "Дагомыс, Мацеста", feeUnder: 500, freeFrom: 5000 },
    { id: "khosta", name: "Хоста", feeUnder: 700, freeFrom: 7000 },
    { id: "adler", name: "Адлер", feeUnder: 900, freeFrom: 9000 },
    { id: "sirius_loo", name: "Сириус, Лоо", feeUnder: 1200, freeFrom: 12000 },
    { id: "krasnaya_polyana", name: "п. Красная поляна", feeUnder: 1800, freeFrom: 18000 },
    { id: "esto_sadok", name: "п. Эсто-Садок", feeUnder: 2000, freeFrom: 20000 },
    { id: "roza_hutor", name: "п. Роза-Хутор", feeUnder: 2200, freeFrom: 22000 },
    { id: "height_960", name: "На высоту 960м (Роза-Хутор/Горки город)", feeUnder: 2400, freeFrom: 24000 },
  ];

  // Единый расчёт стоимости доставки: базовая цена по району + удвоение при «Доставка ночью»
  const getDeliveryPrice = () => {
    if (isPickup || !deliveryType) return 0;
    const zone = deliveryZones.find((z) => z.id === deliveryType);
    if (!zone) return 0;
    const basePrice = state.total >= zone.freeFrom ? 0 : zone.feeUnder;
    const isNightDelivery = deliveryTime === "Доставка ночью";
    return isNightDelivery ? basePrice * 2 : basePrice;
  };

  const deliveryPrice = getDeliveryPrice();
  const selectedZone = deliveryType ? deliveryZones.find((z) => z.id === deliveryType) : null;
  const isNightDelivery = deliveryTime === "Доставка ночью";

  // Итоговая сумма (товары + доставка, без дублирования логики)
  const finalTotal = state.total + deliveryPrice;

  // Форматирование телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("7")) value = value.slice(1);
    if (value.length > 10) value = value.slice(0, 10);

    let formatted = "+7 (";
    if (value.length > 0) formatted += value.slice(0, 3);
    if (value.length > 3) formatted += ") " + value.slice(3, 6);
    if (value.length > 6) formatted += "-" + value.slice(6, 8);
    if (value.length > 8) formatted += "-" + value.slice(8, 10);

    setter(formatted);
  };

  // Авто-подстановка @ для Telegram
  const handleTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value && !value.startsWith("@")) {
      value = "@" + value.replace(/^@+/, "");
    }
    setCustomerTelegram(value);
  };

  // Генерация интервалов времени
  const getTimeIntervals = () => {
    const intervals: string[] = ["Доставка ночью"];
    const today = new Date();
    const selectedDate = deliveryDate ? new Date(deliveryDate) : null;
    const isToday = selectedDate && 
      selectedDate.toDateString() === today.toDateString();
    
    const now = new Date();
    const currentHour = now.getHours();

    for (let hour = 10; hour <= 21; hour++) {
      if (isToday && hour <= currentHour) continue;
      intervals.push(`${hour}:00-${hour + 1}:00`);
    }
    return intervals;
  };

  // Валидация: контакты, получатель, согласие + обязательные данные доставки
  const isFormValid = () => {
    if (!customerName.trim() || !customerPhone || customerPhone.length < 18) return false;
    if (!isRecipientSelf) {
      if (!recipientName.trim() || !recipientPhone || recipientPhone.length < 18) return false;
    }
    if (!agreePrivacy) return false;

    // Должен быть выбран способ: самовывоз, район доставки или «уточнить у получателя»
    const hasDeliveryChoice = deliveryType || isPickup || (!isRecipientSelf && askRecipientForDetails);
    if (!hasDeliveryChoice) return false;

    const needDate = deliveryType || isPickup || (!isRecipientSelf && askRecipientForDetails);
    if (needDate && !deliveryDate.trim()) return false;

    const needTime = (deliveryType || isPickup) && !(!isRecipientSelf && askRecipientForDetails);
    if (needTime && !deliveryTime.trim()) return false;

    if (!isPickup && !(!isRecipientSelf && askRecipientForDetails)) {
      if (!deliveryType) return false;
      if (!deliveryAddress.trim()) return false;
    }

    return true;
  };

  // Минимальная дата (сегодня)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Закрытие dropdown при клике вне
  const handleDeliverySelect = (zoneId: string) => {
    setDeliveryType(zoneId);
    setIsDeliveryDropdownOpen(false);
    setIsPickup(false);
  };

  const handlePickupToggle = () => {
    setIsPickup(!isPickup);
    if (!isPickup) {
      setDeliveryType(null);
      setIsDeliveryDropdownOpen(false);
    }
  };

  const dividerClass = "border-t my-2";
  const dividerStyle = { borderColor: "rgba(129, 149, 112, 0.25)" };

  return (
    <div className="pt-3 border-t" style={{ borderColor: "rgba(129, 149, 112, 0.25)" }}>
      {/* Ваши данные */}
      <div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "#819570" }}>
          Ваши данные
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">
              Имя и фамилия <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Имя и фамилия"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Телефон <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🇷🇺</span>
              <input
                type="tel"
                placeholder="+7 (000) 000-00-00"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e, setCustomerPhone)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Ник в Telegram</label>
            <input
              type="text"
              placeholder="@username"
              value={customerTelegram}
              onChange={handleTelegramChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
            />
          </div>
        </div>
      </div>

      {/* Разделитель → Получатель */}
      <div className={dividerClass} style={dividerStyle} />
      <div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "#819570" }}>Получатель</h3>
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recipient"
              value="self"
              checked={isRecipientSelf}
              onChange={() => setIsRecipientSelf(true)}
              className="w-4 h-4"
              style={{ accentColor: "#819570" }}
            />
            <span className="text-sm">Я получатель</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recipient"
              value="other"
              checked={!isRecipientSelf}
              onChange={() => setIsRecipientSelf(false)}
              className="w-4 h-4"
              style={{ accentColor: "#819570" }}
            />
            <span className="text-sm">Получатель другой человек</span>
          </label>
        </div>

        {/* Данные получателя (показываем только если выбран "другой человек") */}
        {!isRecipientSelf && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Имя получателя"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Телефон <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🇷🇺</span>
                <input
                  type="tel"
                  placeholder="+7 (000) 000-00-00"
                  value={recipientPhone}
                  onChange={(e) => handlePhoneChange(e, setRecipientPhone)}
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Разделитель → Доставка */}
      <div className={dividerClass} style={dividerStyle} />
      <div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "#819570" }}>Доставка</h3>

        {/* Самовывоз (только если "Я получатель"); при выборе скрываем районы и адрес, дата и время остаются */}
        {isRecipientSelf && (
          <div className="mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPickup}
                onChange={handlePickupToggle}
                className="w-4 h-4"
                style={{ accentColor: "#819570" }}
              />
              <span className="text-sm">Самовывоз</span>
            </label>
            {isPickup && (
              <p className="text-sm mt-2 ml-6" style={{ color: "#4a5568" }}>
                Забрать заказ можно по адресу: Пластунская 123а, к2, 2 этаж, 84 офис
              </p>
            )}
          </div>
        )}

        {/* Чекбоксы для "Получатель другой человек" (независимы друг от друга) */}
        {!isRecipientSelf && (
          <div className="mb-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={askRecipientForDetails}
                onChange={(e) => setAskRecipientForDetails(e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: "#819570" }}
              />
              <span className="text-sm">Уточнить время и адрес у получателя</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deliverAnonymously}
                onChange={(e) => setDeliverAnonymously(e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: "#819570" }}
              />
              <span className="text-sm">Доставить анонимно</span>
            </label>
          </div>
        )}

        {/* Селект района доставки: скрыт при самовывозе и при "Уточнить время и адрес у получателя" */}
        {!isPickup && !(!isRecipientSelf && askRecipientForDetails) && (
          <div className="relative mb-3">
            <button
              type="button"
              onClick={() => setIsDeliveryDropdownOpen(!isDeliveryDropdownOpen)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20 text-left flex items-center justify-between bg-white"
              style={{ borderColor: isDeliveryDropdownOpen ? "#819570" : "#d1d5db" }}
            >
              <span className={selectedZone ? "text-gray-900" : "text-gray-500"}>
                {selectedZone
                  ? `${selectedZone.name} ${deliveryPrice === 0 ? "(Бесплатно)" : `+${deliveryPrice}₽`}`
                  : "Район доставки"}
              </span>
              {isNightDelivery && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-[#819570]/15 text-[#819570] whitespace-nowrap">
                  ночной тариф ×2
                </span>
              )}
              <svg
                className={`w-5 h-5 transition-transform ${isDeliveryDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "#819570" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDeliveryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDeliveryDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto" style={{ borderColor: "#819570" }}>
                  {deliveryZones.map((zone) => {
                    const zonePrice = state.total >= zone.freeFrom ? 0 : zone.feeUnder;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => handleDeliverySelect(zone.id)}
                        className="w-full px-4 py-2 text-left hover:bg-[#819570]/10 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{zone.name}</span>
                          <span className="text-sm" style={{ color: "#819570" }}>
                            {zonePrice === 0 ? "Бесплатно" : `+${zonePrice}₽`}
                          </span>
                        </div>
                        {zonePrice > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Бесплатно от {zone.freeFrom.toLocaleString("ru-RU")}₽
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Поле адреса: только для доставки по району, не при самовывозе и не при "Уточнить время и адрес" */}
        {!isPickup && deliveryType && !(!isRecipientSelf && askRecipientForDetails) && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Улица, номер дома, подъезд, квартира, этаж"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
            />
          </div>
        )}

        {/* Дата и время доставки: одна строка на десктопе/планшете, друг под другом на мобильных */}
        {(deliveryType || isPickup || (!isRecipientSelf && askRecipientForDetails)) && (
          <div className="flex flex-col md:flex-row md:gap-4 gap-3">
            <div className="w-full min-w-0 md:flex-1">
              <label className="block text-sm mb-1" style={{ color: "#819570" }}>Дата доставки</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={getMinDate()}
                lang="ru"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
                style={{ borderColor: "#d1d5db" }}
              />
            </div>
            {/* Время доставки: скрыто при "Уточнить время и адрес у получателя"; при самовывозе — показываем */}
            {!(!isRecipientSelf && askRecipientForDetails) && (
              <div className="w-full min-w-0 md:flex-1">
                <label className="block text-sm mb-1" style={{ color: "#819570" }}>Время доставки</label>
                <select
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
                >
                  <option value="">Выберите время</option>
                  {getTimeIntervals().map((interval) => (
                    <option key={interval} value={interval}>
                      {interval}
                    </option>
                  ))}
                </select>
                {deliveryTime === "Доставка ночью" && (
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                    Мы свяжемся с вами для уточнения времени
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Разделитель → Текст для открытки */}
      <div className={dividerClass} style={dividerStyle} />
      <div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "#819570" }}>Текст для открытки</h3>
        <textarea
          placeholder="Напишите пожелания в вашу открытку"
          value={cardText}
          onChange={(e) => setCardText(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20 resize-none"
        />
      </div>

      {/* Разделитель → Комментарий к заказу */}
      <div className={dividerClass} style={dividerStyle} />
      <div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "#819570" }}>Комментарий к заказу</h3>
        <textarea
          placeholder="Если есть пожелания по заказу — укажите их здесь."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20 resize-none"
        />
      </div>

      {/* Промокод */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Промокод"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#819570]/20"
        />
      </div>

      {/* Чекбоксы согласий */}
      <div className="space-y-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeNewsletter}
            onChange={(e) => setAgreeNewsletter(e.target.checked)}
            className="mt-1 w-4 h-4"
            style={{ accentColor: "#819570" }}
          />
          <span className="text-sm">Согласие на получение рассылки</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreePrivacy}
            onChange={(e) => setAgreePrivacy(e.target.checked)}
            className="mt-1 w-4 h-4"
            style={{ accentColor: "#819570" }}
            required
          />
          <span className="text-sm">
            Согласие с политикой конфиденциальности и договором оферты
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberContacts}
            onChange={(e) => setRememberContacts(e.target.checked)}
            className="mt-1 w-4 h-4"
            style={{ accentColor: "#819570" }}
          />
          <span className="text-sm">
            Запомнить контакты в браузере для повторной покупки
          </span>
        </label>
      </div>

      {/* Итоговая сумма (без линии сверху) */}
      <div className="pt-4 space-y-2 text-right">
        <div className="text-sm">
          Сумма: {state.total.toLocaleString("ru-RU")} р.
        </div>
        {deliveryPrice > 0 && (
          <div className="text-sm flex items-center justify-end gap-2 flex-wrap">
            <span>Доставка: {deliveryPrice.toLocaleString("ru-RU")} р.</span>
            {isNightDelivery && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#819570]/15 text-[#819570]">
                ночной тариф ×2
              </span>
            )}
          </div>
        )}
        <div className="text-xl font-bold" style={{ color: "#819570" }}>
          Итоговая сумма: {finalTotal.toLocaleString("ru-RU")} р.
        </div>
      </div>

      {/* Кнопка оплаты: создаём заказ на сервере (сумма пересчитывается по каталогу), инициируем платёж Tinkoff, редирект на страницу оплаты */}
      <PayButton
        disabled={!isFormValid()}
        items={state.items.map((item) => ({ id: item.id, quantity: item.cartQuantity }))}
        customer={{
          name: customerName,
          phone: customerPhone,
          telegram: customerTelegram || undefined,
          recipientName: isRecipientSelf ? customerName : recipientName,
          recipientPhone: isRecipientSelf ? customerPhone : recipientPhone,
          deliveryType: isPickup ? "pickup" : deliveryType ?? undefined,
          isPickup,
          deliveryAddress: deliveryAddress || undefined,
          deliveryDate: deliveryDate || undefined,
          deliveryTime: deliveryTime || undefined,
          deliveryPrice: deliveryPrice,
          cardText: cardText || undefined,
          notes: notes || undefined,
          askRecipientForDetails,
          deliverAnonymously,
        }}
      />
    </div>
  );
}
