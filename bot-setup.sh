#!/bin/bash

# Telegram Bot Setup Script
BOT_TOKEN="8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s"
WEBHOOK_URL="https://transformation-map.com/telegram-webhook"

echo "🤖 Setting up Telegram Bot..."

# Устанавливаем webhook URL
echo "📡 Setting webhook URL: $WEBHOOK_URL"
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}"

echo ""
echo "📋 Getting webhook info..."
curl -X GET "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"

echo ""
echo "✅ Bot setup completed!"
echo "🚀 Now start the bot with: npm run bot:start"