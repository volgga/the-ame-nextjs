# Деплой Next.js на Ubuntu VPS (94.103.84.28)

**Сервер:** 94.103.84.28  
**Стек:** Nginx + PM2, приложение на localhost:3000.

Подключение: `ssh root@94.103.84.28`

---

## Перед началом: переменные окружения

На сервере в `/var/www/app` нужен файл `.env.local`. Создать после клонирования:

```bash
nano /var/www/app/.env.local
```

Вставить (подставь свой `NEXT_PUBLIC_SUPABASE_URL` из дашборда Supabase, если другой):

```
NEXT_PUBLIC_SUPABASE_URL=https://eweaqbtqzzoxpwfmjinp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=G7DOVb26JLGYGmgOmmtzNA__QM03j3k
SUPABASE_SERVICE_ROLE_KEY=RS2RS0FKuqBZBglHTv51_w_c8sqio58
```

Сохранить: `Ctrl+O`, Enter, `Ctrl+X`.

---

## Шаг 1: Обновление системы и установка nginx, git, ufw

```bash
apt update && apt upgrade -y
apt install -y nginx git ufw
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
```

**Если ошибка:**  
- `E: Could not get lock /var/lib/dpkg/lock` — другой apt запущен. Подождать или: `killall apt apt-get; rm -f /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend; apt update`

---

## Шаг 2: Установка nvm, Node.js 20 и PM2

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
node -v
npm -v
npm install -g pm2
pm2 -v
```

**Если ошибка:**  
- `nvm: command not found` после установки — выйти из SSH и зайти снова или выполнить в той же сессии: `source ~/.bashrc` (или `source ~/.nvm/nvm.sh`).  
- Для PM2 при работе под root можно оставить `npm install -g pm2`; при необходимости: `npm install -g pm2 --unsafe-perm`

---

## Шаг 3: Клонирование репозитория

```bash
mkdir -p /var/www
git clone https://github.com/volgga/the-ame-nextjs /var/www/app
ls -la /var/www/app
```

**Если ошибка:**  
- Нет git — вернуться к шагу 1 и установить `git`.  
- `Permission denied (publickey)` — репозиторий приватный; нужен deploy key или клонирование по HTTPS с токеном. Для публичного репо клонирование по HTTPS без ключа должно проходить.

---

## Шаг 4: Зависимости и сборка

```bash
cd /var/www/app
```

Создать `.env.local` (если ещё не создан) с переменными Supabase, затем:

```bash
npm ci
npm run build
```

**Если ошибка:**  
- `npm ERR! ... network` — проверить интернет на сервере: `ping -c 2 8.8.8.8`.  
- `Cannot find module ...` — выполнить снова `npm ci` (полная переустановка).  
- Ошибки сборки TypeScript/ESLint — исправить в коде и закоммитить, затем на сервере снова `git pull && npm ci && npm run build`.  
- Сборка требует переменные (например `NEXT_PUBLIC_*`) — убедиться, что `.env.local` в `/var/www/app` заполнен до `npm run build`.

---

## Шаг 5: Запуск приложения через PM2

```bash
cd /var/www/app
pm2 start npm --name nextapp -- start
pm2 save
pm2 startup systemd -u root --hp /root
```

Вывод `pm2 startup` покажет команду вида `sudo env PATH=... pm2 startup systemd -u root --hp /root` — её нужно выполнить, если система попросит (обычно при первом запуске `pm2 startup` команда уже применяется).

**Если ошибка:**  
- `nextapp` уже есть — удалить: `pm2 delete nextapp`, затем снова `pm2 start npm --name nextapp -- start` и `pm2 save`.  
- Порт 3000 занят — найти процесс: `lsof -i :3000` или `ss -tlnp | grep 3000`, завершить его или сменить порт в Next.js (переменная `PORT`).

---

## Шаг 6: Конфигурация Nginx

Создать конфиг:

```bash
nano /etc/nginx/sites-available/nextapp
```

Вставить (и сохранить):

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Включить сайт и перезагрузить Nginx:

```bash
ln -sf /etc/nginx/sites-available/nextapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

**Если ошибка:**  
- `nginx -t` сообщает об ошибке — проверить синтаксис в `nextapp` (кавычки, точки с запятой).  
- `Address already in use` — порт 80 занят: `ss -tlnp | grep :80`; остановить конфликтующий сервис или использовать другой порт.  
- 502 Bad Gateway — Next.js не слушает 3000: проверить `pm2 status` и `pm2 logs nextapp`, перезапустить `pm2 restart nextapp`.

---

## Шаг 7: Проверка

```bash
curl -I http://94.103.84.28
pm2 status
```

Ожидаемо: в `curl` статус `200 OK` (или `304`), в `pm2 status` процесс `nextapp` в статусе `online`.

**Если ошибка:**  
- `Connection refused` на 80 — ufw/firewall или nginx не слушает 80: `ss -tlnp | grep :80`, `ufw status`.  
- 502 — приложение не запущено или падает: `pm2 logs nextapp`, исправить ошибки (часто не заданы env или падение при старте).

---

## Шаг 8: Обновление приложения после изменений в репозитории

Выполнять на сервере из каталога приложения:

```bash
cd /var/www/app
git pull
npm ci
npm run build
pm2 restart nextapp
```

При добавлении новых переменных окружения — отредактировать `/var/www/app/.env.local` и затем:

```bash
pm2 restart nextapp
```

---

## Краткая шпаргалка

| Действие              | Команда |
|-----------------------|--------|
| Логи приложения       | `pm2 logs nextapp` |
| Рестарт               | `pm2 restart nextapp` |
| Статус                | `pm2 status` |
| Проверка сайта        | `curl -I http://94.103.84.28` |
| Проверка Nginx        | `nginx -t && systemctl status nginx` |
