# Настройка и аудит сервера

## Быстрая настройка сервера

Выполните на сервере одну команду:

```bash
cd /var/www/theame && git pull origin main && sudo bash scripts/server-setup-and-audit.sh
```

Этот скрипт автоматически:
1. ✅ Проверит и установит все необходимые компоненты (Node.js, PM2, Nginx)
2. ✅ Настроит Nginx для проксирования на порт 3000
3. ✅ Установит зависимости проекта
4. ✅ Соберет проект
5. ✅ Запустит PM2 процесс
6. ✅ Очистит диск и память
7. ✅ Проверит доступность сайта

## Ручная проверка после настройки

```bash
# Проверка статуса PM2
pm2 list

# Проверка Nginx
sudo systemctl status nginx

# Проверка доступности сайта
curl -I http://theame.ru

# Проверка использования ресурсов
df -h /
free -h
```

## Полезные команды

### Мониторинг
```bash
# Мониторинг PM2 в реальном времени
pm2 monit

# Логи PM2
pm2 logs theame-next

# Статус всех процессов
pm2 list
```

### Очистка
```bash
# Очистка диска
sudo bash scripts/cleanup-disk.sh

# Быстрое исправление проблем
bash scripts/quick-fix.sh

# Полная диагностика
bash scripts/full-diagnosis.sh
```

### Перезапуск
```bash
# Перезапуск PM2
pm2 restart theame-next

# Перезапуск Nginx
sudo systemctl reload nginx
```
