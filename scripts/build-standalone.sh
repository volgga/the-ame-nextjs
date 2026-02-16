#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[build-standalone] Installing dependencies..."
npm ci 2>/dev/null || npm install

echo "[build-standalone] Building Next.js..."
npm run build

echo "[build-standalone] Copying assets into standalone..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

echo "[build-standalone] Copying run script and PM2 config into standalone..."
cp scripts/run-standalone.sh .next/standalone/
cp ecosystem.config.js .next/standalone/
mkdir -p .next/standalone/logs
chmod +x .next/standalone/run-standalone.sh

echo "[build-standalone] Creating deploy archive..."
tar -czf deploy-standalone.tar.gz -C .next/standalone .

echo "[build-standalone] Done. Archive: deploy-standalone.tar.gz"
