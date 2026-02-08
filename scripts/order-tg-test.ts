/**
 * Dev-тест: отправка трёх тестовых уведомлений о заказах в Telegram (оформление, успех, ошибка).
 * Запуск из nextjs-project: npx tsx scripts/order-tg-test.ts
 * Нужны в env: TELEGRAM_BOT_TOKEN, TELEGRAM_ORDERS_CHAT_ID; опционально TELEGRAM_ORDERS_THREAD_ID=1947
 */

import { config } from "dotenv";
config();
config({ path: ".env.local" });
import { sendOrderTelegramMessage } from "../src/lib/telegram";
import {
  formatOrderPlaced,
  formatPaymentSuccess,
  formatPaymentFailed,
} from "../src/lib/telegramOrdersFormat";
import type { OrderRecord } from "../src/types/order";

const mockOrder: OrderRecord = {
  id: "test-order-" + Date.now(),
  items: [
    { id: "p1", name: "Букет «Розовый рассвет»", price: 3500, quantity: 1 },
    { id: "p2", name: "Открытка", price: 150, quantity: 2 },
  ],
  amount: 3800 * 100,
  currency: "RUB",
  customer: {
    name: "Иван Тестов",
    phone: "+7 999 123-45-67",
    email: "test@example.com",
  },
  status: "payment_pending",
  tinkoffPaymentId: "12345678",
  paymentId: "12345678",
  paymentProvider: "tinkoff",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** Заказ с включёнными опциями: другой получатель, анонимно, уточнить у получателя, рассылки */
const mockOrderWithOptions: OrderRecord = {
  ...mockOrder,
  id: "test-order-options-" + Date.now(),
  customer: {
    name: "Мария Покупатель",
    phone: "+7 999 111-22-33",
    email: "maria@example.com",
    recipientName: "Анна Получатель",
    recipientPhone: "+7 999 444-55-66",
    isRecipientSelf: false,
    deliverAnonymously: true,
    askRecipientForDetails: true,
    receiveMailings: true,
  },
};

async function main() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN не задан");
    process.exit(1);
  }
  if (!process.env.TELEGRAM_ORDERS_CHAT_ID) {
    console.error("TELEGRAM_ORDERS_CHAT_ID не задан");
    process.exit(1);
  }

  console.log("Отправка 1/3: Оформление заказа…");
  try {
    await sendOrderTelegramMessage(formatOrderPlaced(mockOrder));
    console.log("  OK");
  } catch (e) {
    console.error("  Ошибка:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  console.log("Отправка 2/3: Успешная оплата…");
  try {
    await sendOrderTelegramMessage(formatPaymentSuccess(mockOrder, mockOrder.tinkoffPaymentId ?? undefined));
    console.log("  OK");
  } catch (e) {
    console.error("  Ошибка:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  console.log("Отправка 3/3: Неуспешная оплата…");
  try {
    await sendOrderTelegramMessage(formatPaymentFailed(mockOrder, "REJECTED / Отказ банка"));
    console.log("  OK");
  } catch (e) {
    console.error("  Ошибка:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  console.log("Отправка 4/4: Оформление заказа с опциями (получатель другой, анонимно, уточнить у получателя, рассылки)…");
  try {
    await sendOrderTelegramMessage(formatOrderPlaced(mockOrderWithOptions));
    console.log("  OK");
  } catch (e) {
    console.error("  Ошибка:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  console.log("\nВсе 4 сообщения отправлены. В 4-м проверьте блок «Опции»: все 4 строки с ✅.");
}

main();
