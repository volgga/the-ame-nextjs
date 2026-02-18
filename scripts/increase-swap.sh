#!/bin/bash
# Скрипт для увеличения swap на сервере
# Использование: sudo bash scripts/increase-swap.sh [размер в GB, по умолчанию 4GB]

set -euo pipefail

SWAP_SIZE="${1:-4}"
SWAP_FILE="/swapfile"

echo "🔧 Увеличение swap до ${SWAP_SIZE}GB..."
echo ""

# Проверяем, существует ли уже swap файл
if [ -f "$SWAP_FILE" ]; then
  echo "⚠️  Swap файл уже существует: $SWAP_FILE"
  echo "📊 Текущий swap:"
  swapon --show || true
  echo ""
  read -p "Удалить существующий swap и создать новый? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 0
  fi
  echo "🔄 Отключаем существующий swap..."
  swapoff "$SWAP_FILE" 2>/dev/null || true
  echo "🗑️  Удаляем старый swap файл..."
  rm -f "$SWAP_FILE"
fi

# Проверяем доступное место на диске
AVAILABLE_SPACE=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt "$SWAP_SIZE" ]; then
  echo "❌ Недостаточно места на диске: доступно ${AVAILABLE_SPACE}GB, требуется ${SWAP_SIZE}GB"
  exit 1
fi

echo "💾 Создаем swap файл размером ${SWAP_SIZE}GB..."
fallocate -l "${SWAP_SIZE}G" "$SWAP_FILE" || {
  echo "⚠️  fallocate не сработал, используем dd..."
  dd if=/dev/zero of="$SWAP_FILE" bs=1G count="$SWAP_SIZE" status=progress
}

echo "🔒 Устанавливаем права доступа..."
chmod 600 "$SWAP_FILE"

echo "🔧 Форматируем как swap..."
mkswap "$SWAP_FILE"

echo "🚀 Включаем swap..."
swapon "$SWAP_FILE"

echo "💾 Добавляем в /etc/fstab для автозагрузки..."
if ! grep -q "$SWAP_FILE" /etc/fstab 2>/dev/null; then
  echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
  echo "✅ Добавлено в /etc/fstab"
else
  echo "ℹ️  Уже есть в /etc/fstab"
fi

echo ""
echo "✅ Swap успешно увеличен!"
echo ""
echo "📊 Текущий статус swap:"
swapon --show
echo ""
free -h
