# 🛠️ Команды для управления проектом

## 🔥 Разработка в реальном времени (на сервере):

```bash
# Быстрое сохранение изменений
npm run save

# Запуск dev режима (с hot reload)
npm run dev:start

# Возврат к продакшену
npm run prod:start
```

## 🚀 Основные команды для деплоя:

```bash
# Ручной деплой (полный цикл)
npm run deploy

# Или просто запустить скрипт
./deploy.sh
```

## 📊 Управление PM2:

```bash
# Запуск приложения
npm run pm2:start

# Перезапуск (после изменений кода)
npm run pm2:restart

# Остановка
npm run pm2:stop

# Просмотр логов
npm run pm2:logs

# Статус приложения
npm run pm2:status

# Мониторинг в реальном времени
pm2 monit
```

## 🤖 Управление Telegram Bot:

```bash
# Запуск бота-верификатора
pm2 start telegram-verification-bot

# Перезапуск бота
pm2 restart telegram-verification-bot

# Остановка бота
pm2 stop telegram-verification-bot

# Логи бота
pm2 logs telegram-verification-bot --lines 50

# Статус webhook
curl -s https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Health check бота
curl http://localhost:9003/health

# Статистика бота
curl -s http://localhost:9003/stats | jq .
```

## 🔧 Разработка:

```bash
# Локальная разработка (на Windows)
npm run dev

# Сборка проекта
npm run build

# Проверка кода
npm run lint
```

## 🎣 Автодеплой через GitHub:

1. В GitHub репозитории → Settings → Webhooks
2. Add webhook:
   - URL: `http://your-server-ip:9001/webhook`
   - Content type: `application/json`
   - Secret: установи секрет в webhook.js
   - Events: `push`

3. Запусти webhook сервер:
```bash
pm2 start webhook.js --name webhook
pm2 save
```

## 📝 Workflow разработки:

1. **На Windows (разработка):**
   ```bash
   git add .
   git commit -m "New feature"
   git push origin main
   ```

2. **На сервере (автоматически):**
   - GitHub отправляет webhook
   - Запускается автодеплой
   - Приложение перезапускается

## 🔍 Полезные команды:

```bash
# Просмотр последних логов
pm2 logs transformation-map --lines 100

# Перезагрузка с нулевым даунтаймом
pm2 reload transformation-map

# Просмотр метрик
pm2 show transformation-map

# Очистка логов
pm2 flush
```

## 🔐 Мониторинг безопасности:

```bash
# Аналитика бота (конверсия, ошибки)
curl -s http://localhost:9003/stats | jq '.overview'

# Проверка блокировок капчи
curl -s http://localhost:9003/stats | jq '.failures.captcha_blocked'

# Текущие rate limits
cat bot-rate-limits.json | jq .

# Логи безопасности
tail -f logs/telegram-verification-bot-error-2.log

# Мониторинг попыток
watch -n 5 'curl -s http://localhost:9003/stats | jq ".failures"'
```

## 🚨 Команды для экстренных случаев:

```bash
# Экстренная остановка бота
pm2 stop telegram-verification-bot

# Полная перезагрузка системы
pm2 restart all

# Очистка всех логов
pm2 flush all

# Бэкап данных аналитики
cp bot-analytics.json "bot-analytics-backup-$(date +%Y%m%d-%H%M).json"

# Проверка всех процессов
pm2 status && curl -s http://localhost:9003/health
```