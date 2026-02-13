/**
 * Tinkoff Internet Acquiring: подпись (Token) и запрос Init.
 * Секреты только из env; тест/боевой переключается через env (разные TerminalKey/Password).
 */

import { createHash } from "crypto";

const TINKOFF_INIT_URL = "https://securepay.tinkoff.ru/v2/Init";
const TINKOFF_GET_STATE_URL = "https://securepay.tinkoff.ru/v2/GetState";

/** Параметры для Init (только корневые — вложенные объекты не участвуют в Token). */
export interface TinkoffInitParams {
  TerminalKey: string;
  Amount: number; // копейки
  OrderId: string;
  Description?: string;
  SuccessURL?: string;
  FailURL?: string;
  NotificationURL?: string;
  Language?: string;
}

/**
 * Формирование Token по правилам Tinkoff:
 * 1) массив пар ключ:значение (только корневые параметры)
 * 2) добавить Password
 * 3) сортировка по ключу
 * 4) конкатенация только значений
 * 5) SHA-256 (UTF-8)
 */
export function buildTinkoffToken(params: Record<string, string | number | undefined>, password: string): string {
  const withPassword: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    withPassword[k] = String(v);
  }
  withPassword.Password = password;

  const keys = Object.keys(withPassword).sort();
  const concat = keys.map((k) => withPassword[k]).join("");
  return createHash("sha256").update(concat, "utf8").digest("hex");
}

/**
 * Проверка обязательных env для Tinkoff.
 * Если не заданы — кидаем явную ошибку, чтобы приложение не работало в полусломанном состоянии.
 */
function requireTinkoffEnv() {
  const terminalKey = process.env.TINKOFF_TERMINAL_KEY;
  const password = process.env.TINKOFF_PASSWORD;
  if (!terminalKey || !password) {
    throw new Error("TINKOFF_TERMINAL_KEY and TINKOFF_PASSWORD must be set in environment variables");
  }
  return { terminalKey, password };
}

/**
 * Вызов Tinkoff Init. TerminalKey и Password — только из env.
 * Возвращает { PaymentId, PaymentURL } или ошибку.
 */
/** Позиция чека ФФД для Tinkoff Init Receipt. */
export interface TinkoffReceiptItem {
  Name: string;
  Price: number; // копейки
  Quantity: number;
  Amount: number; // копейки
  Tax: "none" | "vat0" | "vat10" | "vat20";
  PaymentMethod?: "full_payment" | "full_prepayment";
  PaymentObject?: "commodity" | "service";
}

/** Чек ФФД для Tinkoff Init (обязателен, если терминал требует онлайн-кассу). */
export interface TinkoffReceipt {
  Email?: string;
  Phone?: string;
  Taxation: "usn_income" | "usn_income_outcome" | "osn" | "esn" | "patent";
  Items: TinkoffReceiptItem[];
}

export async function tinkoffInit(
  params: Omit<TinkoffInitParams, "TerminalKey"> & {
    TerminalKey?: string;
    Password?: string;
    /** Метаданные заказа (адрес, дата, время и т.д.); в Token не входят. */
    Data?: Record<string, string>;
    /** Чек ФФД — обязателен, если в ЛК T-Bank включена онлайн-касса. */
    Receipt?: TinkoffReceipt;
  }
): Promise<{ PaymentId: string; PaymentURL: string } | { error: string; details?: unknown }> {
  const envCreds = requireTinkoffEnv();
  const terminalKey = params.TerminalKey ?? envCreds.terminalKey;
  const password = params.Password ?? envCreds.password;

  const successUrl = params.SuccessURL ?? process.env.TINKOFF_SUCCESS_URL ?? "";
  const failUrl = params.FailURL ?? process.env.TINKOFF_FAIL_URL ?? "";
  const notificationUrl = params.NotificationURL ?? process.env.TINKOFF_NOTIFICATION_URL ?? "";
  const language = params.Language ?? "ru";

  const amount = Math.round(Number(params.Amount));
  const body: Record<string, unknown> = {
    TerminalKey: terminalKey,
    Amount: amount,
    OrderId: String(params.OrderId),
    Description: params.Description ?? `Оплата заказа #${params.OrderId}`,
    SuccessURL: successUrl,
    FailURL: failUrl,
    Language: language,
    Token: "",
  };
  if (notificationUrl) {
    body.NotificationURL = notificationUrl;
  }
  if (params.Data && Object.keys(params.Data).length > 0) {
    body.DATA = params.Data;
  }
  if (params.Receipt && params.Receipt.Items?.length > 0) {
    body.Receipt = {
      Email: params.Receipt.Email,
      Phone: params.Receipt.Phone,
      Taxation: params.Receipt.Taxation ?? "usn_income",
      Items: params.Receipt.Items.map((item) => ({
        Name: String(item.Name).slice(0, 128),
        Price: Math.round(item.Price),
        Quantity: Math.round(item.Quantity * 1000) / 1000,
        Amount: Math.round(item.Amount),
        Tax: item.Tax ?? "none",
        PaymentMethod: item.PaymentMethod ?? "full_payment",
        PaymentObject: item.PaymentObject ?? "commodity",
      })),
    };
  }

  const tokenParams: Record<string, string | number> = {
    TerminalKey: body.TerminalKey as string,
    Amount: amount,
    OrderId: String(params.OrderId),
    Description: (body.Description as string) ?? "",
    SuccessURL: successUrl,
    FailURL: failUrl,
    Language: language,
  };
  if (notificationUrl) {
    tokenParams.NotificationURL = notificationUrl;
  }
  body.Token = buildTinkoffToken(tokenParams, password);

  const res = await fetch(TINKOFF_INIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    Success?: boolean;
    ErrorCode?: string;
    Message?: string;
    Details?: string;
    PaymentId?: string;
    PaymentURL?: string;
    [key: string]: unknown;
  };

  const logCtx = {
    orderId: params.OrderId,
    amount: amount,
    terminalKeyMask: terminalKey ? `${terminalKey.slice(0, 4)}***` : "???",
    errorCode: data.ErrorCode,
    message: data.Message,
    details: data.Details,
  };

  if (!res.ok) {
    console.warn("[tinkoff-init] Tinkoff API HTTP error", logCtx);
    return {
      error: data.Message ?? "Tinkoff Init request failed",
      details: { status: res.status, ErrorCode: data.ErrorCode, Details: data.Details },
    };
  }

  if (data.Success && data.PaymentId != null && data.PaymentURL) {
    return {
      PaymentId: String(data.PaymentId),
      PaymentURL: data.PaymentURL,
    };
  }

  console.warn("[tinkoff-init] Tinkoff Init failed (Success=false)", logCtx);
  return {
    error: data.Message ?? "Tinkoff Init failed",
    details: { ErrorCode: data.ErrorCode, Details: data.Details },
  };
}

/**
 * Получение статуса платежа в T-Bank (GetState).
 * Возвращает статус (CONFIRMED, AUTHORIZED, и т.д.) или ошибку.
 */
export async function tinkoffGetState(
  paymentId: string,
  opts?: { TerminalKey?: string; Password?: string }
): Promise<{ Status: string } | { error: string }> {
  const envCreds = requireTinkoffEnv();
  const terminalKey = opts?.TerminalKey ?? envCreds.terminalKey;
  const password = opts?.Password ?? envCreds.password;
  const token = buildTinkoffToken({ TerminalKey: terminalKey, PaymentId: paymentId }, password);
  const res = await fetch(TINKOFF_GET_STATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ TerminalKey: terminalKey, PaymentId: paymentId, Token: token }),
  });
  const data = (await res.json()) as { Success?: boolean; Status?: string; Message?: string };
  if (!res.ok || !data.Success) {
    return { error: data.Message ?? "GetState failed" };
  }
  return { Status: data.Status ?? "UNKNOWN" };
}

/**
 * Проверка подписи входящего уведомления от Tinkoff.
 * Параметры — все из тела POST, кроме Token и вложенных объектов (Data, Receipt).
 */
export function verifyTinkoffNotificationToken(payload: Record<string, unknown>, password: string): boolean {
  const tokenReceived = payload.Token as string | undefined;
  if (!tokenReceived) return false;

  const forToken: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key === "Token") continue;
    if (key === "Data" || key === "DATA" || key === "Receipt") continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "object" && !Array.isArray(value)) continue;
    forToken[key] = String(value);
  }
  forToken.Password = password;

  const keys = Object.keys(forToken).sort();
  const concat = keys.map((k) => forToken[k]).join("");
  const expected = createHash("sha256").update(concat, "utf8").digest("hex");
  return expected === tokenReceived;
}
