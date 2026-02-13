# Выполните эту команду на сервере:

```bash
ssh root@94.103.84.28 "cd /var/www/theame && bash -c 'pm2 stop nextjs-project 2>/dev/null || true; pm2 delete nextjs-project 2>/dev/null || true; export \$(cat .env.production | grep -v \"^#\" | xargs); rm -rf .next; npm run build; pm2 start ecosystem.config.js; pm2 save; sleep 3; curl -s https://theame.ru/api/payments/tinkoff/notify/check'"
```

Или подключитесь к серверу и выполните:

```bash
ssh root@94.103.84.28
# Пароль: h5==5qiRN3=54VVieep_

cd /var/www/theame
pm2 stop nextjs-project
pm2 delete nextjs-project
export $(cat .env.production | grep -v '^#' | xargs)
rm -rf .next
npm run build
pm2 start ecosystem.config.js
pm2 save
sleep 3
curl https://theame.ru/api/payments/tinkoff/notify/check
```

После выполнения должно быть `"envAllSet":true`
