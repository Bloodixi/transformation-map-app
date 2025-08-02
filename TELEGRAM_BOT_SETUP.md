# 🤖 Telegram Bot Setup - Transformation Map

## 📅 Дата настройки
29.07.2025

## 🎯 Описание
Telegram бот для проекта Transformation Map развернут на том же сервере, что и основной сайт.

---

## 🛠️ Архитектура

### 📍 Расположение файлов:
```
/var/www/transformation-map/
├── telegram-bot.js          # Основной файл бота
├── bot-setup.sh            # Скрипт настройки webhook
├── ecosystem.config.js     # PM2 конфигурация (обновлена)
└── package.json            # Добавлены npm скрипты для бота
```

### 🔧 Настройка сервера:
- **Порт бота:** 9002
- **Webhook URL:** `https://transformation-map.com/telegram-webhook`
- **PM2 процесс:** `telegram-bot`
- **Nginx:** настроен проксинг `/telegram-webhook` → `localhost:9002`

---

## 🤖 Функционал бота

### 📱 Доступные команды:
- `/start` - главное меню с приветствием
- `/help` - справка и список команд  
- `/auth` - генерация ссылки для авторизации

### 🎯 Основные фичи:
1. **Приветствие с кнопками:**
   - 🌐 Открыть сайт
   - 🔐 Авторизоваться

2. **Авторизация:**
   - Генерация уникального токена
   - Прямая ссылка на сайт с токеном
   - Кнопки для быстрого доступа

3. **Помощь и навигация:**
   - Подробная справка
   - Информация о проекте

---

## ⚙️ Конфигурация

### 🔑 Переменные бота:
```javascript
const BOT_TOKEN = '8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s'
const WEBHOOK_PORT = 9002
const WEBHOOK_PATH = '/telegram-webhook'
const DOMAIN = 'https://transformation-map.com'
```

### 📡 Webhook настройки:
- **URL:** `https://transformation-map.com/telegram-webhook`
- **Status:** ✅ Активен
- **IP:** 77.73.235.239
- **Pending updates:** обрабатываются

---

## 🚀 Управление ботом

### 📋 NPM команды:
```bash
# Настройка webhook
npm run bot:setup

# Управление процессом
npm run bot:start    # Запуск бота
npm run bot:stop     # Остановка бота  
npm run bot:restart  # Перезапуск бота
npm run bot:logs     # Просмотр логов
```

### 🔧 PM2 команды:
```bash
# Прямое управление
pm2 start telegram-bot.js --name telegram-bot
pm2 restart telegram-bot
pm2 stop telegram-bot
pm2 logs telegram-bot

# Статус всех процессов
pm2 status
```

---

## 📊 Логирование

### 📁 Файлы логов:
- `./logs/bot-out.log` - обычные логи
- `./logs/bot-error.log` - ошибки
- `./logs/bot-combined.log` - все логи

### 🔍 Мониторинг:
```bash
# Просмотр логов в реальном времени
pm2 logs telegram-bot --lines 50

# Статус процессов
pm2 monit
```

---

## 🌐 Nginx конфигурация

### 📍 Добавлен location block:
```nginx
# Telegram Bot webhook
location /telegram-webhook {
    proxy_pass http://localhost:9002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}
```

---

## ✅ Проверка работоспособности

### 🧪 Тесты:
1. **Webhook:** `curl -X POST https://transformation-map.com/telegram-webhook`
2. **Бот в Telegram:** `/start` в @transformation_map_bot
3. **PM2 статус:** `pm2 status`
4. **Логи:** `pm2 logs telegram-bot`

### 📈 Метрики:
- **Memory usage:** ~15MB
- **CPU usage:** <1%
- **Uptime:** Автоматический перезапуск
- **Response time:** <100ms

---

## 🔧 Возможные проблемы и решения

### ❌ Бот не отвечает:
```bash
# Проверить статус
pm2 status
pm2 logs telegram-bot

# Перезапустить
pm2 restart telegram-bot
```

### ❌ Webhook не работает:
```bash
# Проверить Nginx
nginx -t
systemctl reload nginx

# Переустановить webhook
npm run bot:setup
```

### ❌ Ошибки в логах:
```bash
# Посмотреть последние ошибки  
pm2 logs telegram-bot --err --lines 20

# Очистить логи
pm2 flush telegram-bot
```

---

## 📈 **ОБНОВЛЕНИЯ (02.08.2025)**

### 🔐 **Новые возможности:**

#### **Система повторных попыток капчи с блокировкой:**
- **3 попытки** с прогрессивными сообщениями:
  - 1-я ошибка: "Попробуйте еще раз"
  - 2-я ошибка: "Осталась 1 попытка"  
  - 3-я ошибка: "Блокировка на 5 минут"
- **Полная защита** от обхода блокировки
- **Аналитика** всех попыток и блокировок
- **Автосброс** при успешном прохождении

#### **Методы для работы с капчей:**
```javascript
UserSessionService.isCaptchaBlocked(userId)      // Проверка блокировки
UserSessionService.incrementCaptchaAttempts(userId) // +1 попытка
UserSessionService.blockCaptcha(userId)          // Блок на 5 минут
UserSessionService.getCaptchaBlockTimeLeft(userId)  // Время до разблока
```

#### **Аналитика безопасности:**
- Новый тип ошибки `captcha_blocked` в статистике
- Отслеживание времени блокировки
- Детальная статистика попыток

## 🚀 Следующие шаги

### 🎯 Планы развития:
1. **База данных:** Сохранение пользователей и сессий
2. **Интеграция:** Синхронизация с NextAuth.js  
3. **Команды:** Добавление `/profile`, `/progress`
4. **Уведомления:** Push-уведомления о прогрессе

### 💡 Улучшения:
- Более продвинутая аналитика
- Интеграция с Transformation Map API
- Персонализированные сообщения
- Система достижений

---

## 📞 Контакты

**Бот:** @transformation_map_bot  
**Сайт:** https://transformation-map.com  
**Webhook:** https://transformation-map.com/telegram-webhook

**✅ Статус:** Полностью функционален и готов к использованию!