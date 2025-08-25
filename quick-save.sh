#!/bin/bash

# 💾 Быстрое сохранение изменений в Git
echo "💾 Quick save changes..."

# Добавляем все изменения
git add .

# Создаем коммит с текущим временем
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "🔧 Work in progress - $TIMESTAMP

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Отправляем на GitHub
git push origin main

echo "✅ Changes saved to GitHub!"