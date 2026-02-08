"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import type { OrderCustomerPayload } from "@/types/order";
import type { DeliveryZone } from "@/types/delivery";
import { PhoneInput, toE164, isValidPhone } from "@/components/ui/PhoneInput";
import { PromoCodeBlock, type PromoTotals } from "./PromoCodeBlock";

/** Контакты отправителя — всегда в localStorage (восстанавливаются после закрытия вкладки). */
const LOCAL_STORAGE_SENDER_KEY = "theame.checkout.sender";
/** Получатель, доставка, адрес и пр. — в sessionStorage (сбрасываются при закрытии вкладки/браузера). */
const SESSION_STORAGE_CHECKOUT_EXTRA_KEY = "theame.checkout.extra";

interface SavedSenderData {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerTelegram?: string;
}

interface SavedExtraData {
  recipientName?: string;
  recipientPhone?: string;
  isRecipientSelf?: boolean;
  deliveryType?: string | null;
  isPickup?: boolean;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  cardText?: string;
  notes?: string;
}

const FIELD_IDS = {
  customerName: "checkout-customerName",
  customerPhone: "checkout-customerPhone",
  recipientName: "checkout-recipientName",
  recipientPhone: "checkout-recipientPhone",
  agreePrivacy: "checkout-agreePrivacy",
  deliveryZone: "checkout-deliveryZone",
  deliveryAddress: "checkout-deliveryAddress",
  deliveryDate: "checkout-deliveryDate",
  deliveryTime: "checkout-deliveryTime",
} as const;

/** Кнопка «Оплатить»: при невалидной форме — onInvalidSubmit(firstInvalidId); иначе создаёт заказ и редирект на оплату. */
function PayButton({
  formValid,
  isFormValid,
  getFirstInvalidFieldId,
  onInvalidSubmit,
  items,
  customer,
}: {
  formValid: boolean;
  isFormValid: () => boolean;
  getFirstInvalidFieldId: () => string | null;
  onInvalidSubmit: (fieldId: string) => void;
  items: { id: string; quantity: number }[];
  customer: OrderCustomerPayload;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!formValid || !isFormValid()) {
      const firstId = getFirstInvalidFieldId();
      if (firstId) onInvalidSubmit(firstId);
      return;
    }
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
        disabled={loading || !formValid}
        className="w-full py-4 mt-6 rounded-full font-semibold text-white uppercase transition-colors disabled:cursor-not-allowed bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
      >
        {loading ? "Подготовка…" : "ПЕРЕЙТИ К ОПЛАТЕ"}
      </button>
    </>
  );
}

type CheckoutFormModalProps = {
  totals: PromoTotals;
  onTotalsUpdate: (newTotals: PromoTotals) => void;
  onTotalsReset: () => void;
};

/**
 * CheckoutFormModal — форма оформления заказа внутри модалки.
 * Упрощённая версия без валидации и отправки (пока).
 */
export function CheckoutFormModal({ totals, onTotalsUpdate, onTotalsReset }: CheckoutFormModalProps) {
  const { state } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerTelegram, setCustomerTelegram] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isRecipientSelf, setIsRecipientSelf] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<string | null>(null);
  const [isPickup, setIsPickup] = useState(false);
  const [isDeliveryDropdownOpen, setIsDeliveryDropdownOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [cardText, setCardText] = useState("");
  const [notes, setNotes] = useState("");
  const [agreeNewsletter, setAgreeNewsletter] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [rememberContacts, setRememberContacts] = useState(true);
  // Чекбоксы для "Получатель другой человек"
  const [askRecipientForDetails, setAskRecipientForDetails] = useState(false);
  const [deliverAnonymously, setDeliverAnonymously] = useState(false);
  /** Id первого незаполненного обязательного поля (для scroll+focus+red после клика «Оплатить»). */
  const [firstInvalidField, setFirstInvalidField] = useState<string | null>(null);

  const saveSenderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveExtraTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveSenderToStorage = useCallback(() => {
    if (saveSenderTimeoutRef.current) clearTimeout(saveSenderTimeoutRef.current);
    saveSenderTimeoutRef.current = setTimeout(() => {
      try {
        const data: SavedSenderData = {
          customerName: customerName || undefined,
          customerPhone: customerPhone ? toE164(customerPhone) : undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerTelegram: customerTelegram || undefined,
        };
        localStorage.setItem(LOCAL_STORAGE_SENDER_KEY, JSON.stringify(data));
      } catch {
        console.warn("Failed to save sender data to localStorage");
      }
    }, 400);
  }, [customerName, customerPhone, customerEmail, customerTelegram]);

  const saveExtraToStorage = useCallback(() => {
    if (saveExtraTimeoutRef.current) clearTimeout(saveExtraTimeoutRef.current);
    saveExtraTimeoutRef.current = setTimeout(() => {
      try {
        const data: SavedExtraData = {
          recipientName: recipientName || undefined,
          recipientPhone: recipientPhone ? toE164(recipientPhone) : undefined,
          isRecipientSelf,
          deliveryType,
          isPickup,
          deliveryAddress: deliveryAddress || undefined,
          deliveryDate: deliveryDate || undefined,
          deliveryTime: deliveryTime || undefined,
          cardText: cardText || undefined,
          notes: notes || undefined,
        };
        sessionStorage.setItem(SESSION_STORAGE_CHECKOUT_EXTRA_KEY, JSON.stringify(data));
      } catch {
        console.warn("Failed to save checkout extra to sessionStorage");
      }
    }, 400);
  }, [
    recipientName,
    recipientPhone,
    isRecipientSelf,
    deliveryType,
    isPickup,
    deliveryAddress,
    deliveryDate,
    deliveryTime,
    cardText,
    notes,
  ]);

  // Загрузка при монтировании: sender из localStorage, extra из sessionStorage
  useEffect(() => {
    try {
      const savedSender = localStorage.getItem(LOCAL_STORAGE_SENDER_KEY);
      if (savedSender) {
        const data: SavedSenderData = JSON.parse(savedSender);
        if (data.customerName) setCustomerName(data.customerName);
        if (data.customerPhone) setCustomerPhone(data.customerPhone);
        if (data.customerEmail) setCustomerEmail(data.customerEmail);
        if (data.customerTelegram) setCustomerTelegram(data.customerTelegram);
      }
    } catch {
      console.warn("Failed to load sender from localStorage");
    }
    try {
      const savedExtra = sessionStorage.getItem(SESSION_STORAGE_CHECKOUT_EXTRA_KEY);
      if (savedExtra) {
        const data: SavedExtraData = JSON.parse(savedExtra);
        if (data.recipientName) setRecipientName(data.recipientName);
        if (data.recipientPhone) setRecipientPhone(data.recipientPhone);
        if (typeof data.isRecipientSelf === "boolean") setIsRecipientSelf(data.isRecipientSelf);
        if (data.deliveryType !== undefined) setDeliveryType(data.deliveryType);
        if (typeof data.isPickup === "boolean") setIsPickup(data.isPickup);
        if (data.deliveryAddress) setDeliveryAddress(data.deliveryAddress);
        if (data.deliveryDate) setDeliveryDate(data.deliveryDate);
        if (data.deliveryTime) setDeliveryTime(data.deliveryTime);
        if (data.cardText) setCardText(data.cardText);
        if (data.notes) setNotes(data.notes);
      }
    } catch {
      console.warn("Failed to load checkout extra from sessionStorage");
    }
  }, []);

  useEffect(() => {
    saveSenderToStorage();
    return () => {
      if (saveSenderTimeoutRef.current) {
        clearTimeout(saveSenderTimeoutRef.current);
        saveSenderTimeoutRef.current = null;
      }
    };
  }, [saveSenderToStorage]);

  useEffect(() => {
    saveExtraToStorage();
    return () => {
      if (saveExtraTimeoutRef.current) {
        clearTimeout(saveExtraTimeoutRef.current);
        saveExtraTimeoutRef.current = null;
      }
    };
  }, [saveExtraToStorage]);

  // Зоны доставки из админки (единый источник: API → delivery_zones в Supabase)
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/delivery-zones", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: DeliveryZone[]) => {
        if (!cancelled && Array.isArray(data)) setDeliveryZones(data);
      })
      .catch(() => {
        if (!cancelled) setDeliveryZones([]);
      })
      .finally(() => {
        if (!cancelled) setZonesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Стандартная цена по зоне (без ночного тарифа): бесплатно при достижении порога, иначе price.
  const getStandardZonePrice = (zone: DeliveryZone) =>
    state.total >= zone.freeFrom ? 0 : zone.price;

  // Единый расчёт стоимости доставки: по району, порог бесплатной доставки, ночной тариф ×2 только при сумме ниже порога.
  const getDeliveryPrice = () => {
    if (isPickup || !deliveryType) return 0;
    const zone = deliveryZones.find((z) => z.id === deliveryType);
    if (!zone) return 0;
    const isNightDelivery = deliveryTime === "Доставка ночью";
    const standardPrice = getStandardZonePrice(zone);
    if (isNightDelivery) {
      return state.total >= zone.freeFrom ? zone.price : zone.price * 2;
    }
    return standardPrice;
  };

  const deliveryPrice = getDeliveryPrice();
  const selectedZone = deliveryType ? deliveryZones.find((z) => z.id === deliveryType) : null;
  const isNightDelivery = deliveryTime === "Доставка ночью";

  // Итоговая сумма (товары со скидкой промокода + доставка)
  const subtotalWithPromo = totals.total;
  const finalTotal = subtotalWithPromo + deliveryPrice;

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
    const isToday = selectedDate && selectedDate.toDateString() === today.toDateString();

    const now = new Date();
    const currentHour = now.getHours();

    for (let hour = 10; hour <= 21; hour++) {
      if (isToday && hour <= currentHour) continue;
      intervals.push(`${hour}:00-${hour + 1}:00`);
    }
    return intervals;
  };

  const customerPhoneE164 = toE164(customerPhone);
  const recipientPhoneE164 = toE164(recipientPhone);

  // Валидация: контакты, получатель, согласие + обязательные данные доставки
  const isFormValid = () => {
    if (!customerName.trim() || !customerPhoneE164 || !isValidPhone(customerPhoneE164)) return false;
    if (!isRecipientSelf) {
      if (!recipientName.trim() || !recipientPhoneE164 || !isValidPhone(recipientPhoneE164)) return false;
    }
    if (!agreePrivacy) return false;

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

  // Первое незаполненное поле (порядок как в isFormValid) для scroll+focus+highlight
  const getFirstInvalidFieldId = (): string | null => {
    if (!customerName.trim()) return FIELD_IDS.customerName;
    if (!customerPhoneE164 || !isValidPhone(customerPhoneE164)) return FIELD_IDS.customerPhone;
    if (!isRecipientSelf) {
      if (!recipientName.trim()) return FIELD_IDS.recipientName;
      if (!recipientPhoneE164 || !isValidPhone(recipientPhoneE164)) return FIELD_IDS.recipientPhone;
    }
    if (!agreePrivacy) return FIELD_IDS.agreePrivacy;
    const hasDeliveryChoice = deliveryType || isPickup || (!isRecipientSelf && askRecipientForDetails);
    if (!hasDeliveryChoice) return FIELD_IDS.deliveryZone;
    const needDate = deliveryType || isPickup || (!isRecipientSelf && askRecipientForDetails);
    if (needDate && !deliveryDate.trim()) return FIELD_IDS.deliveryDate;
    const needTime = (deliveryType || isPickup) && !(!isRecipientSelf && askRecipientForDetails);
    if (needTime && !deliveryTime.trim()) return FIELD_IDS.deliveryTime;
    if (!isPickup && !(!isRecipientSelf && askRecipientForDetails)) {
      if (!deliveryType) return FIELD_IDS.deliveryZone;
      if (!deliveryAddress.trim()) return FIELD_IDS.deliveryAddress;
    }
    return null;
  };

  const handleInvalidSubmit = (fieldId: string) => {
    setFirstInvalidField(fieldId);
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const toFocus = el instanceof HTMLLabelElement ? el.querySelector<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("input, select, button, textarea") : el;
        (toFocus as HTMLElement)?.focus?.();
      }
    }, 100);
  };

  const clearFieldError = (fieldId: string) => {
    if (firstInvalidField === fieldId) setFirstInvalidField(null);
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

  const dividerClass = "border-t my-2 border-border-block";

  return (
    <div className="pt-3 border-t border-border-block">
      {/* Ваши данные: сетка 2x2 на desktop */}
      <div>
        <h3 className="text-base font-semibold mb-2 text-color-text-main">Ваши данные</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">
              Имя и фамилия <span className="text-red-500">*</span>
            </label>
            <input
              id={FIELD_IDS.customerName}
              type="text"
              placeholder="Имя и фамилия"
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); clearFieldError(FIELD_IDS.customerName); }}
              className={`w-full px-4 py-3 min-h-[48px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${firstInvalidField === FIELD_IDS.customerName ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300"}`}
            />
            {firstInvalidField === FIELD_IDS.customerName && <p className="text-sm text-red-600 mt-1">Заполните имя и фамилию</p>}
          </div>
          <div>
            <PhoneInput
              id={FIELD_IDS.customerPhone}
              value={customerPhone}
              onChange={(v) => { setCustomerPhone(v); clearFieldError(FIELD_IDS.customerPhone); }}
              label="Телефон"
              required
              error={firstInvalidField === FIELD_IDS.customerPhone ? "Введите корректный номер телефона" : undefined}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Ник в Telegram (необязательно)</label>
            <input
              type="text"
              placeholder="@username"
              value={customerTelegram}
              onChange={handleTelegramChange}
              className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Почта (необязательно)</label>
            <input
              type="email"
              placeholder="example@mail.ru"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Разделитель → Получатель */}
      <div className={dividerClass} />
      <div>
        <h3 className="text-base font-semibold mb-2 text-color-text-main">Получатель</h3>
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recipient"
              value="self"
              checked={isRecipientSelf}
              onChange={() => {
                setIsRecipientSelf(true);
                setIsPickup(false);
              }}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">Я получатель</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recipient"
              value="other"
              checked={!isRecipientSelf}
              onChange={() => {
                setIsRecipientSelf(false);
                setIsPickup(false);
              }}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">Получатель другой человек</span>
          </label>
        </div>

        {/* Данные получателя (показываем только если выбран "другой человек") */}
        {!isRecipientSelf && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">
                Имя получателя <span className="text-red-500">*</span>
              </label>
              <input
                id={FIELD_IDS.recipientName}
                type="text"
                placeholder="Имя получателя"
                value={recipientName}
                onChange={(e) => { setRecipientName(e.target.value); clearFieldError(FIELD_IDS.recipientName); }}
                className={`w-full px-4 py-3 min-h-[48px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${firstInvalidField === FIELD_IDS.recipientName ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300"}`}
              />
              {firstInvalidField === FIELD_IDS.recipientName && <p className="text-sm text-red-600 mt-1">Заполните имя получателя</p>}
            </div>
            <div>
              <PhoneInput
                id={FIELD_IDS.recipientPhone}
                value={recipientPhone}
                onChange={(v) => { setRecipientPhone(v); clearFieldError(FIELD_IDS.recipientPhone); }}
                label="Телефон получателя"
                required
                error={firstInvalidField === FIELD_IDS.recipientPhone ? "Введите корректный номер телефона получателя" : undefined}
              />
            </div>
          </div>
        )}
      </div>

      {/* Разделитель → Доставка */}
      <div className={dividerClass} />
      <div>
        <h3 className="text-base font-semibold mb-2 text-color-text-main">Доставка</h3>

        {/* Селект района доставки: скрыт при самовывозе и при "Уточнить время и адрес у получателя" */}
        {!isPickup && !(!isRecipientSelf && askRecipientForDetails) && (
          <div className="relative mb-3">
            <button
              id={FIELD_IDS.deliveryZone}
              type="button"
              onClick={() => { setIsDeliveryDropdownOpen(!isDeliveryDropdownOpen); clearFieldError(FIELD_IDS.deliveryZone); }}
              className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-left flex items-center justify-between bg-white ${firstInvalidField === FIELD_IDS.deliveryZone ? "border-red-500 focus:ring-red-500/30" : isDeliveryDropdownOpen ? "border-border-block" : "border-gray-300"}`}
            >
              <span className={selectedZone ? "text-gray-900" : "text-gray-500"}>
                {selectedZone
                  ? `${selectedZone.title} ${deliveryPrice === 0 ? "(Бесплатно)" : `+${deliveryPrice}₽`}`
                  : "Район доставки"}
                <span className="text-red-500"> *</span>
              </span>
              {isNightDelivery && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-color-text-main/10 text-color-text-main whitespace-nowrap">
                  ночной тариф ×2
                </span>
              )}
              <svg
                className={`w-5 h-5 transition-transform text-color-text-main ${isDeliveryDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {firstInvalidField === FIELD_IDS.deliveryZone && <p className="text-sm text-red-600 mt-1">Выберите район доставки или самовывоз</p>}
            {isDeliveryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDeliveryDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-block rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {zonesLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Загрузка районов…</div>
                  ) : (
                    deliveryZones.map((zone) => {
                      const zonePrice = getStandardZonePrice(zone);
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => handleDeliverySelect(zone.id)}
                          className="w-full px-4 py-2 text-left hover:bg-color-text-main/10 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{zone.title}</span>
                            <span className="text-sm text-color-text-main">
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
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Самовывоз (только если "Я получатель"); при выборе скрываем районы и адрес, дата и время остаются */}
        {isRecipientSelf && (
          <div className="mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPickup}
                onChange={handlePickupToggle}
                className="w-4 h-4 accent-primary"
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

        {/* Чекбоксы для "Получатель другой человек" (независимы друг от друга) - под селектом района */}
        {!isRecipientSelf && (
          <div className="mb-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={askRecipientForDetails}
                onChange={(e) => setAskRecipientForDetails(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">Уточнить время и адрес у получателя</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deliverAnonymously}
                onChange={(e) => setDeliverAnonymously(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">Доставить анонимно</span>
            </label>
          </div>
        )}

        {/* Поле адреса: только для доставки по району, не при самовывозе и не при "Уточнить время и адрес" */}
        {!isPickup && deliveryType && !(!isRecipientSelf && askRecipientForDetails) && (
          <div className="mb-3">
            <input
              id={FIELD_IDS.deliveryAddress}
              type="text"
              placeholder="Улица, номер дома, подъезд, квартира, этаж"
              value={deliveryAddress}
              onChange={(e) => { setDeliveryAddress(e.target.value); clearFieldError(FIELD_IDS.deliveryAddress); }}
              className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${firstInvalidField === FIELD_IDS.deliveryAddress ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300"}`}
            />
            {firstInvalidField === FIELD_IDS.deliveryAddress && <p className="text-sm text-red-600 mt-1">Укажите адрес доставки</p>}
          </div>
        )}

        {/* Дата и время доставки: одна строка на десктопе/планшете, друг под другом на мобильных */}
        {(deliveryType || isPickup || (!isRecipientSelf && askRecipientForDetails)) && (
          <div className="flex flex-col md:flex-row md:gap-4 gap-3">
            <div className="w-full min-w-0 md:flex-1">
              <label className="block text-sm mb-1 text-color-text-main">Дата доставки <span className="text-red-500">*</span></label>
              <input
                id={FIELD_IDS.deliveryDate}
                type="date"
                value={deliveryDate}
                onChange={(e) => { setDeliveryDate(e.target.value); clearFieldError(FIELD_IDS.deliveryDate); }}
                min={getMinDate()}
                lang="ru"
                className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${firstInvalidField === FIELD_IDS.deliveryDate ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300"}`}
              />
              {firstInvalidField === FIELD_IDS.deliveryDate && <p className="text-sm text-red-600 mt-1">Выберите дату доставки</p>}
            </div>
            {/* Время доставки: скрыто при "Уточнить время и адрес у получателя"; при самовывозе — показываем */}
            {!(!isRecipientSelf && askRecipientForDetails) && (
              <div className="w-full min-w-0 md:flex-1">
                <label className="block text-sm mb-1 text-color-text-main">Время доставки <span className="text-red-500">*</span></label>
                <select
                  id={FIELD_IDS.deliveryTime}
                  value={deliveryTime}
                  onChange={(e) => { setDeliveryTime(e.target.value); clearFieldError(FIELD_IDS.deliveryTime); }}
                  className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${firstInvalidField === FIELD_IDS.deliveryTime ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Выберите время</option>
                  {getTimeIntervals().map((interval) => (
                    <option key={interval} value={interval}>
                      {interval}
                    </option>
                  ))}
                </select>
                {firstInvalidField === FIELD_IDS.deliveryTime && <p className="text-sm text-red-600 mt-1">Выберите время доставки</p>}
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
      <div className={dividerClass} />
      <div>
        <h3 className="text-base font-semibold mb-2 text-color-text-main">Текст для открытки</h3>
        <textarea
          placeholder="Напишите пожелания в вашу открытку"
          value={cardText}
          onChange={(e) => setCardText(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 min-h-[88px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Разделитель → Комментарий к заказу */}
      <div className={dividerClass} />
      <div>
        <h3 className="text-base font-semibold mb-2 text-color-text-main">Комментарий к заказу</h3>
        <textarea
          placeholder="Если есть пожелания по заказу — укажите их здесь."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 min-h-[88px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Промокод */}
      <div className={dividerClass} />
      <PromoCodeBlock
        subtotal={state.total}
        totals={totals}
        onApplySuccess={onTotalsUpdate}
        onRemoveSuccess={onTotalsReset}
        variant="checkout"
      />
      <p className="text-sm text-muted-foreground mb-6">
        В подарок мы упакуем ваш букет в транспортировочную коробку, добавим рекомендации по уходу, кризал и открытку по
        желанию.
      </p>

      {/* Чекбоксы согласий */}
      <div className="space-y-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeNewsletter}
            onChange={(e) => setAgreeNewsletter(e.target.checked)}
            className="mt-1 w-4 h-4 accent-primary"
          />
          <span className="text-sm">Согласие на получение рассылки</span>
        </label>
        <label id={FIELD_IDS.agreePrivacy} className={`flex items-start gap-2 cursor-pointer ${firstInvalidField === FIELD_IDS.agreePrivacy ? "rounded ring-2 ring-red-500 ring-offset-1" : ""}`}>
          <input
            type="checkbox"
            checked={agreePrivacy}
            onChange={(e) => { setAgreePrivacy(e.target.checked); clearFieldError(FIELD_IDS.agreePrivacy); }}
            className="mt-1 w-4 h-4 accent-primary"
            required
          />
          <span className="text-sm">Согласие с политикой конфиденциальности и договором оферты</span>
        </label>
        {firstInvalidField === FIELD_IDS.agreePrivacy && <p className="text-sm text-red-600 mt-1">Необходимо согласие с политикой конфиденциальности</p>}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberContacts}
            onChange={(e) => setRememberContacts(e.target.checked)}
            className="mt-1 w-4 h-4 accent-primary"
          />
          <span className="text-sm">Запомнить контакты в браузере для повторной покупки</span>
        </label>
      </div>

      {/* Итоговая сумма (без линии сверху) */}
      <div className="pt-4 space-y-2 text-right">
        <div className="text-sm">Сумма: {subtotalWithPromo.toLocaleString("ru-RU")} р.</div>
        {totals.discount > 0 && (
          <div className="text-sm text-green-600">Скидка: -{totals.discount.toLocaleString("ru-RU")} р.</div>
        )}
        {deliveryPrice > 0 && (
          <div className="text-sm flex items-center justify-end gap-2 flex-wrap">
            <span>Доставка: {deliveryPrice.toLocaleString("ru-RU")} р.</span>
            {isNightDelivery && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-color-text-main/10 text-color-text-main">
                ночной тариф ×2
              </span>
            )}
          </div>
        )}
        <div className="text-xl font-bold text-color-text-main">
          Итоговая сумма: {finalTotal.toLocaleString("ru-RU")} р.
        </div>
      </div>

      {/* Кнопка оплаты: при невалидной форме — scroll+focus+highlight первого поля; иначе создаём заказ и редирект на оплату */}
      <PayButton
        formValid={isFormValid()}
        isFormValid={isFormValid}
        getFirstInvalidFieldId={getFirstInvalidFieldId}
        onInvalidSubmit={handleInvalidSubmit}
        items={state.items.map((item) => ({ id: item.id, quantity: item.cartQuantity }))}
        customer={{
          name: customerName,
          phone: customerPhoneE164 || undefined,
          email: customerEmail.trim() || undefined,
          telegram: customerTelegram || undefined,
          recipientName: isRecipientSelf ? customerName : recipientName,
          recipientPhone: isRecipientSelf ? customerPhoneE164 : recipientPhoneE164,
          deliveryType: isPickup ? "pickup" : (deliveryType ?? undefined),
          deliveryZoneTitle: selectedZone?.title,
          isPickup,
          deliveryAddress: deliveryAddress || undefined,
          deliveryDate: deliveryDate || undefined,
          deliveryTime: deliveryTime || undefined,
          deliveryPrice: deliveryPrice,
          cardText: cardText || undefined,
          notes: notes || undefined,
          askRecipientForDetails,
          deliverAnonymously,
          isRecipientSelf,
          receiveMailings: agreeNewsletter,
        }}
      />
    </div>
  );
}
