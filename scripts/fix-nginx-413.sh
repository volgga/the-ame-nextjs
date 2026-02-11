#!/bin/bash
# Исправление 413 при загрузке файлов в админке theame.ru
# Запуск на сервере: ssh root@94.103.84.28 'bash -s' < scripts/fix-nginx-413.sh

set -e

CONF="/etc/nginx/sites-available/theame.ru"
[ -f "$CONF" ] || CONF="/etc/nginx/sites-available/nextapp"
[ -f "$CONF" ] || { echo "ERROR: Nginx config not found"; exit 1; }

cp "$CONF" "${CONF}.bak.$(date +%Y%m%d-%H%M%S)"
echo "Backup created"

# Удаляем старый client_max_body_size если есть
sed -i '/^[[:space:]]*client_max_body_size/d' "$CONF" 2>/dev/null || true

# Вставляем директивы после первой строки "server {"
awk '
/server[[:space:]]*\{/ && !inserted {
  print
  print "    client_max_body_size 30m;"
  print "    client_body_buffer_size 1m;"
  print "    proxy_read_timeout 300;"
  print "    proxy_send_timeout 300;"
  print "    send_timeout 300;"
  inserted = 1
  next
}
{ print }
' "$CONF" > "${CONF}.new" && mv "${CONF}.new" "$CONF"

nginx -t && systemctl reload nginx
echo "OK: nginx reloaded. client_max_body_size 30m applied."
