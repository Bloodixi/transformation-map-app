# 🛠️ Команды для управления проектом

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