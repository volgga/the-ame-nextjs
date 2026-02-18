#!/bin/bash
# Скрипт для проверки памяти и рекомендаций по оптимизации сборки
# Использование: bash scripts/check-server-memory.sh

set -euo pipefail

echo "🔍 Проверка памяти сервера..."
echo ""

# Проверяем доступную память
if command -v free >/dev/null 2>&1; then
  echo "📊 Информация о памяти:"
  free -h
  echo ""
  
  # Получаем доступную память в MB
  AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}' || echo "0")
  TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}' || echo "0")
  
  echo "💾 Всего памяти: ${TOTAL_MEM}MB"
  echo "💾 Доступно памяти: ${AVAILABLE_MEM}MB"
  echo ""
  
  # Рекомендации
  if [ "$AVAILABLE_MEM" -lt 1024 ]; then
    echo "⚠️  КРИТИЧНО: Доступно менее 1GB памяти!"
    echo "💡 Рекомендации:"
    echo "   1. Добавьте swap: sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
    echo "   2. Или увеличьте RAM на сервере"
  elif [ "$AVAILABLE_MEM" -lt 2048 ]; then
    echo "⚠️  ВНИМАНИЕ: Доступно менее 2GB памяти"
    echo "💡 Рекомендации:"
    echo "   1. Рекомендуется добавить swap (минимум 2GB)"
    echo "   2. Или увеличить RAM до 4GB+"
  elif [ "$AVAILABLE_MEM" -lt 4096 ]; then
    echo "✅ Достаточно памяти для сборки (рекомендуется 4GB+)"
  else
    echo "✅ Отлично! Достаточно памяти для сборки"
  fi
else
  echo "⚠️  Команда 'free' не найдена, используйте другую команду для проверки памяти"
fi

echo ""
echo "💾 Проверка swap:"
if command -v swapon >/dev/null 2>&1; then
  SWAP_INFO=$(swapon --show 2>/dev/null || echo "")
  if [ -z "$SWAP_INFO" ]; then
    echo "⚠️  Swap не настроен!"
    echo "💡 Рекомендуется добавить swap для предотвращения OOM (Out of Memory) ошибок"
    echo "   Команда для создания 2GB swap:"
    echo "   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
  else
    echo "✅ Swap настроен:"
    echo "$SWAP_INFO"
  fi
else
  echo "⚠️  Команда 'swapon' не найдена"
fi

echo ""
echo "📊 Рекомендуемые настройки для сборки:"
if [ "$AVAILABLE_MEM" -ge 4096 ]; then
  echo "   NODE_OPTIONS='--max-old-space-size=4096'"
elif [ "$AVAILABLE_MEM" -ge 2048 ]; then
  echo "   NODE_OPTIONS='--max-old-space-size=3072'"
else
  echo "   NODE_OPTIONS='--max-old-space-size=2048'"
  echo "   ⚠️  Но рекомендуется добавить swap или увеличить RAM"
fi
