/**
 * PM2 config — минимальный, стандартный запуск Next.js
 * Запуск: pm2 start ecosystem.config.cjs (из корня проекта)
 */
module.exports = {
  apps: [
    {
      name: "theame-next",
      script: "npm",
      args: "start",
      cwd: "/var/www/theame",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
