/**
 * PM2 config для запуска Next.js standalone на VPS.
 * КРИТИЧНО: cwd должен указывать внутрь .next/standalone — иначе server.js не найдёт статику.
 * Статику раздаёт Nginx (см. nginx-final.conf), Node.js обрабатывает только динамику/API/_next/image.
 * Запуск: pm2 start ecosystem.config.cjs (из корня проекта).
 */
const path = require("path");
const fs = require("fs");
const root = __dirname;
const standaloneDir = path.resolve(root, ".next/standalone");

// На сервере обычно .env; локально можно .env.production
const envPath = fs.existsSync(path.join(root, ".env"))
  ? path.join(root, ".env")
  : path.join(root, ".env.production");
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
      script: "server.js",
      cwd: standaloneDir,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
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
        TELEGRAM_THREAD_ID: getEnv("TELEGRAM_THREAD_ID"),
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
