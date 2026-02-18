#!/bin/bash
# Скрипт для безопасной очистки диска на сервере
# Использование: sudo bash scripts/cleanup-disk.sh

set -euo pipefail

echo "🧹 ОЧИСТКА ДИСКА"
echo "================"
echo ""

# Показываем текущее использование диска
echo "📊 Текущее использование диска:"
df -h / | tail -1
echo ""

# Показываем размеры больших директорий
echo "📁 Размеры больших директорий:"
du -sh /var/www/theame/* 2>/dev/null | sort -hr | head -10 || true
echo ""

# 1. Очистка кеша пакетов apt
echo "1️⃣  Очистка кеша apt..."
BEFORE_APT=$(du -sh /var/cache/apt/archives 2>/dev/null | cut -f1 || echo "0")
apt-get clean
apt-get autoclean
echo "✅ Очищено кеша apt"
echo ""

# 2. Очистка старых логов
echo "2️⃣  Очистка старых логов..."
# Логи старше 7 дней
find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +30 -delete 2>/dev/null || true
journalctl --vacuum-time=7d 2>/dev/null || true
echo "✅ Очищены старые логи"
echo ""

# 3. Очистка npm кеша
echo "3️⃣  Очистка npm кеша..."
if command -v npm >/dev/null 2>&1; then
  npm cache clean --force 2>/dev/null || true
  echo "✅ Очищен npm кеш"
else
  echo "ℹ️  npm не найден, пропускаем"
fi
echo ""

# 4. Очистка старых сборок Next.js (опционально)
echo "4️⃣  Проверка старых сборок Next.js..."
if [ -d "/var/www/theame/.next" ]; then
  NEXT_SIZE=$(du -sh /var/www/theame/.next 2>/dev/null | cut -f1 || echo "0")
  echo "   Размер .next: $NEXT_SIZE"
  echo "   ⚠️  Не удаляем - это текущая сборка!"
else
  echo "   ℹ️  Директория .next не найдена"
fi
echo ""

# 5. Очистка старых логов PM2
echo "5️⃣  Очистка старых логов PM2..."
if [ -d "/var/www/theame/logs" ]; then
  # Оставляем только последние 1000 строк в логах
  if [ -f "/var/www/theame/logs/out.log" ]; then
    tail -1000 /var/www/theame/logs/out.log > /tmp/pm2-out.log 2>/dev/null && \
    mv /tmp/pm2-out.log /var/www/theame/logs/out.log 2>/dev/null || true
  fi
  if [ -f "/var/www/theame/logs/err.log" ]; then
    tail -1000 /var/www/theame/logs/err.log > /tmp/pm2-err.log 2>/dev/null && \
    mv /tmp/pm2-err.log /var/www/theame/logs/err.log 2>/dev/null || true
  fi
  echo "✅ Очищены логи PM2 (оставлены последние 1000 строк)"
else
  echo "   ℹ️  Директория logs не найдена"
fi
echo ""

# 6. Очистка временных файлов
echo "6️⃣  Очистка временных файлов..."
rm -rf /tmp/* 2>/dev/null || true
rm -rf /var/tmp/* 2>/dev/null || true
find /tmp -type f -atime +7 -delete 2>/dev/null || true
find /var/tmp -type f -atime +7 -delete 2>/dev/null || true
echo "✅ Очищены временные файлы"
echo ""

# 7. Очистка старых ядер (если есть)
echo "7️⃣  Проверка старых ядер Linux..."
OLD_KERNELS=$(dpkg -l | grep -E 'linux-image-[0-9]' | grep -v $(uname -r) | awk '{print $2}' || echo "")
if [ -n "$OLD_KERNELS" ]; then
  echo "   Найдены старые ядра:"
  echo "$OLD_KERNELS" | head -5
  echo ""
  read -p "Удалить старые ядра? (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    apt-get purge -y $OLD_KERNELS 2>/dev/null || true
    echo "✅ Удалены старые ядра"
  else
    echo "   Пропущено"
  fi
else
  echo "   ℹ️  Старых ядер не найдено"
fi
echo ""

# 8. Очистка Docker (если установлен)
echo "8️⃣  Проверка Docker..."
if command -v docker >/dev/null 2>&1; then
  docker system prune -af --volumes 2>/dev/null || true
  echo "✅ Очищен Docker (если был установлен)"
else
  echo "   ℹ️  Docker не установлен"
fi
echo ""

# Показываем результат
echo "📊 Использование диска после очистки:"
df -h / | tail -1
echo ""

# Показываем самые большие директории
echo "📁 Топ-10 самых больших директорий:"
du -h --max-depth=1 / 2>/dev/null | sort -hr | head -11 | tail -10 || true

echo ""
echo "✅ Очистка завершена!"
