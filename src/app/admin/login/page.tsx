"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseAdminResponse } from "@/lib/adminFetch";

export default function AdminLoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = "/api/admin/login";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password }),
      });
      const result = await parseAdminResponse<{ error?: string }>(res, {
        method: "POST",
        url,
      });
      if (!result.ok) {
        const apiError = result.data && typeof result.data.error === "string" ? result.data.error : null;
        const message = apiError
          ? `${apiError}${result.message ? ` (${result.message})` : ""}`
          : result.message ?? "Ошибка входа";
        setError(message);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-border-block bg-white hover:border-border-block-hover p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#111]">Вход в админку</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login" className="block text-sm font-medium text-[#111]">
            Логин
          </label>
          <input
            id="login"
            type="text"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-color-text-main focus:outline-none focus:ring-1 focus:ring-color-text-main"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#111]">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-color-text-main focus:outline-none focus:ring-1 focus:ring-color-text-main"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded text-white py-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
        >
          {loading ? "Вход…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
