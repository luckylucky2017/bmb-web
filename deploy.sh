#!/bin/bash
# Run this ON THE SERVER (inside /opt/bmb-vietnam/app) after `git push origin
# main` from your dev machine. Pulls the latest code, rebuilds the app image
# only (db image is pulled straight from Docker Hub, never rebuilt), and
# restarts just the app container — db keeps running untouched the whole
# time, so this never risks the database.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Đồng bộ git..."
git pull origin main

echo "==> Build lại image app..."
docker compose build app

echo "==> Khởi động lại app (db không bị động vào)..."
docker compose up -d app

echo "==> Đợi app khởi động..."
sleep 3
docker compose ps

echo "==> Kiểm tra nhanh..."
if curl -fsS -o /dev/null http://localhost:3010/; then
  echo "OK — trang chủ phản hồi bình thường."
else
  echo "CẢNH BÁO — trang chủ không phản hồi, kiểm tra: docker compose logs app --tail 50"
  exit 1
fi
