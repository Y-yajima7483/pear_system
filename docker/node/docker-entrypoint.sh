#!/bin/bash
set -e

echo "Next.js project found. Installing dependencies..."
cd /app
yarn install

# 実行コマンドを実行
exec "$@"