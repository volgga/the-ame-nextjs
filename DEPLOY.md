# Документация по автодеплою

Этот проект настроен на автоматический деплой на сервер через GitHub Actions при каждом push в ветку `main`.

## Как это работает

1. При каждом `git push origin main` запускается GitHub Actions workflow
2. Workflow подключается к серверу по SSH
3. На сервере выполняется обновление кода, установка зависимостей, сборка и перезапуск приложения

## Настройка GitHub Secrets

В репозитории GitHub нужно добавить следующие секреты (Settings → Secrets and variables → Actions → New repository secret):

### Обязательные секреты:

- **`DEPLOY_HOST`** — IP-адрес или домен сервера (например: `123.45.67.89` или `server.example.com`)
- **`DEPLOY_USER`** — имя пользователя для SSH подключения (например: `deploy` или `root`)
- **`DEPLOY_SSH_KEY`** — приватный SSH ключ без passphrase для подключения к серверу
- **`DEPLOY_PATH`** — путь к директории проекта на сервере (например: `/var/www/theame`)

### Опциональные секреты:

- **`DEPLOY_PORT`** — SSH порт (по умолчанию: `22`)

### Переменные для прод-сборки (уже заданы в workflow)

В `.github/workflows/deploy.yml` для сборки и рантайма заданы `SITE_URL` и `NEXT_PUBLIC_SITE_URL` = `https://theame.ru`. Они передаются на сервер при деплое и подхватываются при `npm run build` и в PM2 (`ecosystem.config.js`). Менять не требуется, если прод — theame.ru.

## Подготовка сервера

### 1. Установка Node.js

Убедитесь, что на сервере установлен Node.js 20:

```bash
# Если используете nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20

# Или установите Node.js системно через пакетный менеджер
```

### 2. Установка PM2

```bash
npm install -g pm2
```

### 3. Подготовка директории проекта

```bash
# Создайте директорию (если не существует)
sudo mkdir -p /var/www/theame
sudo chown $USER:$USER /var/www/theame

# Клонируйте репозиторий
cd /var/www/theame
git clone https://github.com/volgga/the-ame-nextjs.git .

# Или если репозиторий уже клонирован, просто перейдите в директорию
cd /var/www/theame
```

### 4. Настройка SSH ключа для GitHub Actions

#### Вариант A: Создание нового SSH ключа специально для деплоя

```bash
# На сервере создайте новый SSH ключ
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# Добавьте публичный ключ в authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Скопируйте приватный ключ (выведите его на экран)
cat ~/.ssh/github_actions_deploy
```

Скопируйте вывод приватного ключа и добавьте его в GitHub Secrets как `DEPLOY_SSH_KEY`.

#### Вариант B: Использование существующего ключа

Если у вас уже есть SSH ключ на сервере:

```bash
# Убедитесь, что публичный ключ добавлен в authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Скопируйте приватный ключ
cat ~/.ssh/id_rsa
```

**⚠️ Важно:** Используйте ключ без passphrase, так как GitHub Actions не может интерактивно вводить пароль.

### 5. Первый запуск приложения через PM2

```bash
cd /var/www/theame

# Установите зависимости
npm ci

# Соберите проект
npm run build

# Запустите через PM2
pm2 start ecosystem.config.js

# Сохраните список процессов PM2 для автозапуска
pm2 save

# Настройте автозапуск PM2 при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет pm2 startup
```

### 6. Проверка имени PM2 процесса

Убедитесь, что имя процесса в PM2 соответствует имени в `ecosystem.config.js`:

```bash
pm2 list
```

По умолчанию используется имя `nextjs-project` (из `ecosystem.config.js`).

## Ручной деплой (если нужно)

Если нужно выполнить деплой вручную на сервере:

```bash
cd /var/www/theame
bash scripts/deploy.sh
```

Для VPS с автоматическим поиском проекта: `bash scripts/deploy-vps-remote.sh` (из корня проекта на сервере).

## Проверка работы автодеплоя

1. Сделайте небольшое изменение в коде
2. Закоммитьте и запушьте в `main`:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Перейдите в GitHub → Actions и следите за выполнением workflow
4. После успешного деплоя проверьте, что сайт обновился

## Устранение проблем

### Ошибка: "PM2 is not installed"
- Установите PM2: `npm install -g pm2`

### Ошибка: "Failed to restart PM2 process"
- Проверьте список процессов: `pm2 list`
- Убедитесь, что процесс с нужным именем существует
- Если процесса нет, запустите: `pm2 start ecosystem.config.js`

### Ошибка: "Directory does not exist"
- Проверьте, что путь в `DEPLOY_PATH` правильный
- Убедитесь, что директория существует и доступна для пользователя

### Ошибка SSH подключения
- Проверьте, что SSH ключ добавлен в GitHub Secrets правильно (включая заголовки `-----BEGIN` и `-----END`)
- Убедитесь, что публичный ключ добавлен в `~/.ssh/authorized_keys` на сервере
- Проверьте права доступа: `chmod 600 ~/.ssh/authorized_keys`

### Ошибка сборки
- Проверьте логи в GitHub Actions
- Убедитесь, что все зависимости установлены: `npm ci`
- Проверьте, что Node.js версии 20 установлен: `node --version`
