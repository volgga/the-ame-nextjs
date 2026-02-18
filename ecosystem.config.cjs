/**
 * PM2 config для запуска Next.js standalone на VPS (VDSina и др.).
 * Standalone — минимальный footprint, критично для 1GB RAM.
 * Запуск из корня проекта: pm2 start ecosystem.config.cjs
 * Переменные (ADMIN_*, Supabase, Tinkoff, Telegram и т.д.) берутся из .env.production.
 * Логи: pm2 logs или logs/out.log, logs/err.log
 */
const path = require("path");
const fs = require("fs");
const root = __dirname;
const standaloneDir = path.join(root, ".next/standalone");

const envPath = path.join(root, ".env.production");
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const t = line.replace(/\r$/, "").trim();
    if (t && !t.startsWith("#")) {
      const eq = t.indexOf("=");
      if (eq > 0) {
        const key = t.slice(0, eq).trim();
        let value = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        value = value.replace(/\r$/, "");
        envVars[key] = value;
      }
    }
  });
}
const getEnv = (key, def = "") => envVars[key] || process.env[key] || def;

module.exports = {
  apps: [
    {
      name: "theame-next",
      script: path.join(standaloneDir, "server.js"),
      cwd: standaloneDir,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        ADMIN_USERNAME: getEnv("ADMIN_USERNAME", "admin"),
        ADMIN_PASSWORD_HASH: getEnv("ADMIN_PASSWORD_HASH"),
        ADMIN_PASSWORD_PLAIN: getEnv("ADMIN_PASSWORD_PLAIN"),
        ADMIN_SESSION_SECRET: getEnv("ADMIN_SESSION_SECRET"),
        NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
        SITE_URL: getEnv("SITE_URL"),
        NEXT_PUBLIC_SITE_URL: getEnv("NEXT_PUBLIC_SITE_URL"),
        TINKOFF_TERMINAL_KEY: getEnv("TINKOFF_TERMINAL_KEY"),
        TINKOFF_PASSWORD: getEnv("TINKOFF_PASSWORD"),
        TINKOFF_NOTIFICATION_URL: getEnv("TINKOFF_NOTIFICATION_URL"),
        TELEGRAM_BOT_TOKEN: getEnv("TELEGRAM_BOT_TOKEN"),
        TELEGRAM_CHAT_ID: getEnv("TELEGRAM_CHAT_ID"),
        TELEGRAM_ORDERS_CHAT_ID: getEnv("TELEGRAM_ORDERS_CHAT_ID"),
        TELEGRAM_ORDERS_THREAD_ID: getEnv("TELEGRAM_ORDERS_THREAD_ID"),
      },
      error_file: path.join(root, "logs/err.log"),
      out_file: path.join(root, "logs/out.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
