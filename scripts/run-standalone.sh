#!/usr/bin/env bash
set -euo pipefail
export NODE_ENV=production
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
cd "$(dirname "$0")"
node server.js
