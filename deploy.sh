#!/bin/bash

# 🚀 Автодеплой скрипт для transformation-map
echo "🚀 Starting deployment..."

# Переходим в директорию проекта
cd /var/www/transformation-map

# Получаем последние изменения из git
echo "📡 Pulling latest changes from Git..."
git pull origin main

# Устанавливаем зависимости (только если package.json изменился)
if git diff HEAD~1 HEAD --name-only | grep -q package.json; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Собираем проект
echo "🔨 Building project..."
npm run build

# Перезапускаем приложение через PM2
echo "🔄 Restarting application..."
pm2 restart transformation-map

# Показываем статус
echo "✅ Deployment completed!"
pm2 status transformation-map
pm2 logs transformation-map --lines 5