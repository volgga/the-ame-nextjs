/**
 * PM2 config для запуска Next.js на VPS (VDSina и др.).
 * Запуск обязательно из корня проекта: pm2 start ecosystem.config.cjs
 * Или с полным путём: pm2 start /path/to/project/ecosystem.config.cjs
 * Логи: pm2 logs или logs/out.log, logs/err.log
 */
const path = require("path");
const root = __dirname;

module.exports = {
  apps: [
    {
      name: "theame-next",
      script: path.join(root, "node_modules/next/dist/bin/next"),
      args: "start",
      cwd: root,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: { NODE_ENV: "production" },
      error_file: path.join(root, "logs/err.log"),
      out_file: path.join(root, "logs/out.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
