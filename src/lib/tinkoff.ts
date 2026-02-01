/**
 * Tinkoff Internet Acquiring: подпись (Token) и запрос Init.
 * Секреты только из env; тест/боевой переключается через env (разные TerminalKey/Password).
 */

import { createHash } from "crypto";

const TINKOFF_INIT_URL = "https://securepay.tinkoff.ru/v2/Init";

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
 * Вызов Tinkoff Init. TerminalKey и Password — только из env.
 * Возвращает { PaymentId, PaymentURL } или ошибку.
 */
export async function tinkoffInit(
  params: Omit<TinkoffInitParams, "TerminalKey"> & {
    TerminalKey?: string;
    Password?: string;
  }
): Promise<{ PaymentId: string; PaymentURL: string } | { error: string; details?: unknown }> {
  const terminalKey = params.TerminalKey ?? process.env.TINKOFF_TERMINAL_KEY;
  const password = params.Password ?? process.env.TINKOFF_PASSWORD;

  if (!terminalKey || !password) {
    return { error: "TINKOFF_TERMINAL_KEY or TINKOFF_PASSWORD not set" };
  }

  const body: TinkoffInitParams & { Token: string } = {
    TerminalKey: terminalKey,
    Amount: params.Amount,
    OrderId: params.OrderId,
    Description: params.Description ?? `Оплата заказа #${params.OrderId}`,
    SuccessURL: params.SuccessURL ?? process.env.TINKOFF_SUCCESS_URL ?? "",
    FailURL: params.FailURL ?? process.env.TINKOFF_FAIL_URL ?? "",
    NotificationURL: params.NotificationURL ?? process.env.TINKOFF_NOTIFICATION_URL ?? "",
    Language: params.Language ?? "ru",
    Token: "",
  };

  const tokenParams: Record<string, string | number> = {
    TerminalKey: body.TerminalKey,
    Amount: body.Amount,
    OrderId: body.OrderId,
    Description: body.Description ?? "",
    SuccessURL: body.SuccessURL ?? "",
    FailURL: body.FailURL ?? "",
    NotificationURL: body.NotificationURL ?? "",
    Language: body.Language ?? "ru",
  };
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
    PaymentId?: string;
    PaymentURL?: string;
    [key: string]: unknown;
  };

  if (!res.ok) {
    return {
      error: data.Message ?? "Tinkoff Init request failed",
      details: { status: res.status, ErrorCode: data.ErrorCode },
    };
  }

  if (data.Success && data.PaymentId != null && data.PaymentURL) {
    return {
      PaymentId: String(data.PaymentId),
      PaymentURL: data.PaymentURL,
    };
  }

  return {
    error: data.Message ?? "Tinkoff Init failed",
    details: { ErrorCode: data.ErrorCode },
  };
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
    if (key === "Data" || key === "Receipt") continue;
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
