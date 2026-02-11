/** PM2 config for production Next.js. Use: pm2 start ecosystem.config.js (from /var/www/theame on server) */
module.exports = {
  apps: [
    {
      name: "nextjs-project",
      script: "npx",
      args: "next start -p 3000",
      cwd: "/var/www/theame",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
