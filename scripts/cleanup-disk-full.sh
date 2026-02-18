#!/bin/bash
# Полная очистка диска на сервере
# Использование: sudo bash scripts/cleanup-disk-full.sh

set -euo pipefail

echo "🧹 ПОЛНАЯ ОЧИСТКА ДИСКА"
echo "======================"
echo ""

# Показываем текущее использование
echo "📊 Текущее использование диска:"
df -h / | tail -1
echo ""

# Очистка apt кеша
echo "1️⃣  Очистка apt кеша..."
apt-get clean >/dev/null 2>&1 || true
apt-get autoclean >/dev/null 2>&1 || true
apt-get autoremove -y >/dev/null 2>&1 || true
echo "✅ apt кеш очищен"

# Очистка npm кеша
echo ""
echo "2️⃣  Очистка npm кеша..."
npm cache clean --force >/dev/null 2>&1 || true
echo "✅ npm кеш очищен"

# Очистка старых логов
echo ""
echo "3️⃣  Очистка старых логов..."
find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +30 -delete 2>/dev/null || true
journalctl --vacuum-time=7d >/dev/null 2>&1 || true
echo "✅ Логи очищены"

# Очистка временных файлов
echo ""
echo "4️⃣  Очистка временных файлов..."
rm -rf /tmp/* 2>/dev/null || true
find /tmp -type f -atime +7 -delete 2>/dev/null || true
rm -rf /var/tmp/* 2>/dev/null || true
find /var/tmp -type f -atime +7 -delete 2>/dev/null || true
echo "✅ Временные файлы очищены"

# Очистка старых ядер (если есть)
echo ""
echo "5️⃣  Очистка старых ядер Linux..."
if command -v apt-get >/dev/null 2>&1; then
  OLD_KERNELS=$(dpkg -l | grep -E 'linux-image-[0-9]' | grep -v $(uname -r | sed 's/-.*//') | awk '{print $2}' | head -5)
  if [ -n "$OLD_KERNELS" ]; then
    echo "   Удаляем старые ядра: $OLD_KERNELS"
    apt-get purge -y $OLD_KERNELS >/dev/null 2>&1 || true
  else
    echo "   Старых ядер не найдено"
  fi
fi
echo "✅ Ядра проверены"

# Очистка PM2 логов (оставляем последние 500 строк)
echo ""
echo "6️⃣  Очистка PM2 логов..."
if [ -d "/var/www/theame/logs" ]; then
  if [ -f "/var/www/theame/logs/out.log" ]; then
    tail -500 /var/www/theame/logs/out.log > /tmp/pm2-out.log 2>/dev/null && \
    mv /tmp/pm2-out.log /var/www/theame/logs/out.log 2>/dev/null || true
  fi
  if [ -f "/var/www/theame/logs/err.log" ]; then
    tail -500 /var/www/theame/logs/err.log > /tmp/pm2-err.log 2>/dev/null && \
    mv /tmp/pm2-err.log /var/www/theame/logs/err.log 2>/dev/null || true
  fi
fi
pm2 flush >/dev/null 2>&1 || true
echo "✅ PM2 логи очищены"

# Очистка .next/cache если он слишком большой
echo ""
echo "7️⃣  Очистка Next.js кеша..."
if [ -d "/var/www/theame/.next/cache" ]; then
  CACHE_SIZE=$(du -sh /var/www/theame/.next/cache 2>/dev/null | cut -f1 || echo "0")
  echo "   Размер кеша: $CACHE_SIZE"
  # Очищаем только если кеш больше 500MB
  CACHE_SIZE_MB=$(du -sm /var/www/theame/.next/cache 2>/dev/null | cut -f1 || echo "0")
  if [ "$CACHE_SIZE_MB" -gt 500 ]; then
    echo "   Кеш слишком большой, очищаем..."
    rm -rf /var/www/theame/.next/cache/* 2>/dev/null || true
  fi
fi
echo "✅ Next.js кеш проверен"

# Финальный статус
echo ""
echo "📊 Итоговое использование диска:"
df -h / | tail -1
echo ""
echo "✅ ОЧИСТКА ЗАВЕРШЕНА!"
