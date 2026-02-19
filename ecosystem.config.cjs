/**
 * PM2 config — минимальный, стандартный запуск Next.js
 * cwd: PM2_CWD (env) > __dirname (директория конфига) > process.cwd()
 * Так PM2 корректно запускается при любом пути деплоя.
 */
const path = require("path");

const cwd = process.env.PM2_CWD
  ? path.resolve(process.env.PM2_CWD)
  : path.resolve(__dirname);

module.exports = {
  apps: [
    {
      name: "theame-next",
      script: "npm",
      args: "start",
      cwd,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
