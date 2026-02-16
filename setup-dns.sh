#!/bin/bash
# Скрипт для настройки DNS на сервере через systemd-resolved
# Выполнить на сервере: sudo bash setup-dns.sh

set -e

echo "🔧 Настройка DNS через systemd-resolved..."

# Определяем интерфейс
INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1 || echo "eth0")
echo "📡 Используется интерфейс: $INTERFACE"

# Настраиваем DNS через resolvectl
if command -v resolvectl >/dev/null 2>&1; then
  echo "✅ Настройка DNS серверов через resolvectl..."
  resolvectl dns "$INTERFACE" 8.8.8.8 8.8.4.4
  resolvectl flush-caches
  
  echo "✅ DNS настроен через systemd-resolved"
  echo "📋 Текущий статус:"
  resolvectl status "$INTERFACE" | grep -A 5 "DNS Servers" || resolvectl status | grep -A 5 "DNS Servers"
else
  echo "⚠️ resolvectl не найден, используем альтернативный метод..."
  
  # Альтернативный способ через netplan (если используется)
  if [ -d /etc/netplan ]; then
    echo "📝 Настройка через netplan..."
    NETPLAN_FILE=$(ls /etc/netplan/*.yaml | head -1)
    if [ -n "$NETPLAN_FILE" ]; then
      echo "💡 Отредактируйте $NETPLAN_FILE и добавьте:"
      echo "    nameservers:"
      echo "      addresses: [8.8.8.8, 8.8.4.4]"
      echo "Затем выполните: sudo netplan apply"
    fi
  fi
fi

# Добавляем GitHub в /etc/hosts для надежности
echo ""
echo "📝 Добавление GitHub в /etc/hosts..."
if ! grep -q "github.com" /etc/hosts 2>/dev/null; then
  # Пробуем несколько IP адресов GitHub
  GITHUB_IPS="140.82.121.3 140.82.121.4 140.82.112.3"
  for IP in $GITHUB_IPS; do
    if ping -c 1 -W 2 "$IP" >/dev/null 2>&1; then
      echo "$IP github.com" | tee -a /etc/hosts
      echo "✅ Добавлен $IP -> github.com в /etc/hosts"
      break
    fi
  done
else
  echo "✅ GitHub уже есть в /etc/hosts"
fi

# Проверяем резолвинг
echo ""
echo "🔍 Проверка DNS резолвинга..."
if getent hosts github.com >/dev/null 2>&1; then
  echo "✅ github.com резолвится в: $(getent hosts github.com | awk '{print $1}')"
else
  echo "❌ Ошибка резолвинга github.com"
fi

# Тестируем подключение
echo ""
echo "🔍 Тестирование подключения к GitHub..."
if ping -c 2 github.com >/dev/null 2>&1; then
  echo "✅ GitHub доступен"
else
  echo "❌ GitHub недоступен"
fi

echo ""
echo "✅ Настройка DNS завершена!"
