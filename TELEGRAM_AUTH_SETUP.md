# 🤖 Telegram Authorization Setup Guide

Полная документация по настройке Telegram авторизации для проекта Transformation Map.

## 📅 Дата работы
27.07.2025

## 🎯 Цель
Интеграция Telegram авторизации в Next.js приложение для замены стандартной email/password авторизации.

---

## 🛠️ Выполненные этапы

### ✅ Этап 1: Настройка ngrok для локальной разработки
**Проблема:** Telegram требует HTTPS домен для Login Widget

**Решение:**
- Установлен ngrok через ручную загрузку в `C:\tools\ngrok\`
- Настроен authtoken: `30S92xk0WGVMPbctbLU8LqhJOAg_2j4VQZvyVPG55Az8ruSY4`
- Запущен туннель: `ngrok http 3000`
- Получен публичный URL: `https://158eb3b35f13.ngrok-free.app`

**Команды:**
```bash
# Установка токена
ngrok config add-authtoken 30S92xk0WGVMPbctbLU8LqhJOAg_2j4VQZvyVPG55Az8ruSY4

# Запуск туннеля
ngrok http 3000
```

### ✅ Этап 2: Создание и настройка Telegram бота
**Бот:** `@transformation_map_bot`
**Token:** `8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s`

**Настройка домена через @BotFather:**
```
/setdomain
@transformation_map_bot
158eb3b35f13.ngrok-free.app
```

### ✅ Этап 3: Установка NextAuth.js 5 и зависимостей
```bash
npm install next-auth@beta @auth/prisma-adapter
npm install crypto-js
```

### ✅ Этап 4: Созданные файлы и компоненты

#### 📄 `.env.local`
```env
# NextAuth.js Configuration
NEXTAUTH_URL=https://158eb3b35f13.ngrok-free.app
NEXTAUTH_SECRET=super-secret-key-for-transformation-map-2025

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s
TELEGRAM_BOT_USERNAME=transformation_map_bot
```

#### 📄 `lib/auth.ts`
- NextAuth.js 5 конфигурация
- Custom Telegram Credentials provider
- Верификация HMAC-SHA-256 через Web Crypto API (для Edge Runtime)
- Обработка Telegram auth данных

#### 📄 `components/telegram-login.tsx`
- Компонент для Telegram авторизации
- Изначально: Telegram Login Widget (не работал из-за "Bot domain invalid")
- Сейчас: Простая кнопка с генерацией auth токенов

#### 📄 `components/telegram-login-form.tsx`
- Форма авторизации только через Telegram
- Содержит тестовые кнопки и демо-авторизацию
- Заменяет стандартную email/password форму

#### 📄 `app/api/auth/[...nextauth]/route.ts`
- NextAuth.js API роуты

#### 📄 `app/api/auth/telegram/route.ts`
- API endpoint для верификации Telegram данных
- Использует Web Crypto API для HMAC проверки

#### 📄 `app/api/auth/telegram-verify/route.ts`
- Endpoint для завершения авторизации
- Показывает промежуточную страницу "Завершение авторизации..."
- Перенаправляет на защищенную страницу с пользовательскими данными

#### 📄 `middleware.ts`
- Упрощенный middleware только для интернационализации
- Исключает NextAuth routes во избежание конфликтов

#### 📄 `app/[locale]/auth/login/page.tsx`
- Обновленная страница входа
- Использует `TelegramLoginForm` вместо стандартной формы

#### 📄 `app/[locale]/protected/page.tsx`
- Защищенная страница личного кабинета
- Показывает информацию пользователя из URL параметров
- Демонстрирует карту трансформации (заглушка)

#### 📄 `app/[locale]/protected/layout.tsx`
- Упрощенный layout без Supabase зависимостей
- Навигация с брендингом Transformation Map

---

## 🔧 Архитектура решения

### Поток авторизации:
1. **Пользователь** → Нажимает "ДЕМО: Войти как Виталий"
2. **Клиент** → Генерирует токен и пользовательские данные
3. **Клиент** → Перенаправляет на `/api/auth/telegram-verify?...`
4. **Сервер** → Показывает страницу "Завершение авторизации..."
5. **Клиент** → Автоматический редирект на `/protected?user_id=...`
6. **Защищенная страница** → Показывает пользовательские данные

### Проблемы и решения:

#### ❌ Проблема: "Bot domain invalid"
- **Причина:** Telegram Login Widget не работает с localhost
- **Попытки:** ngrok туннель, правильная настройка домена в @BotFather
- **Результат:** Widget все равно показывает ошибку

#### ✅ Решение: Альтернативный подход
- Замена Telegram Login Widget на обычную кнопку
- Симуляция Telegram авторизации для демо
- Использование API endpoints для обработки данных

#### ❌ Проблема: Edge Runtime не поддерживает Node.js crypto
- **Ошибка:** `crypto module not supported in Edge Runtime`
- **Решение:** Замена на Web Crypto API (`crypto.subtle`)

#### ❌ Проблема: Конфликт с Supabase
- **Ошибка:** `Invalid URL` в AuthButton component
- **Решение:** Упрощение layout, удаление Supabase зависимостей

---

## 🧪 Текущее состояние

### ✅ Работает:
- ngrok туннель для HTTPS
- Telegram бот настроен с правильным доменом
- NextAuth.js 5 установлен и настроен
- Демо-авторизация через кнопку
- Защищенные страницы с пользовательскими данными
- Интернационализация (ru/en)

### ❓ Не полностью работает:
- Настоящий Telegram Login Widget (показывает "Bot domain invalid")
- Интеграция с реальным Telegram ботом
- Полная NextAuth.js сессия (используем URL параметры)

### 🚧 Требует доработки:
- Создание настоящего Telegram бота для обработки команд
- Интеграция с базой данных для хранения пользователей
- Полноценная система сессий
- Защита от CSRF и других атак

---

## 🎯 Следующие шаги (когда будем продолжать):

1. **Вариант А: Доработка Telegram Widget**
   - Исследовать причину "Bot domain invalid"
   - Попробовать альтернативные домены/настройки

2. **Вариант Б: Telegram Bot API**
   - Создать webhook обработчик для бота
   - Реализовать команды `/start`, генерацию auth ссылок
   - Полноценная интеграция с Telegram Bot API

3. **Вариант В: Упрощенная система**
   - Доработать текущее демо-решение
   - Добавить базу данных и сессии
   - Сохранить простоту без сложных интеграций

---

## 📚 Полезные ресурсы

- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [NextAuth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [ngrok Documentation](https://ngrok.com/docs)
- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

## 💡 Выводы

Сегодня мы успешно создали рабочую демо-версию Telegram авторизации, несмотря на технические ограничения с Telegram Login Widget. Основная функциональность работает, и у нас есть четкое понимание архитектуры для дальнейшего развития проекта.

**Время работы:** ~3 часа
**Основная проблема:** Telegram Login Widget требует более сложной настройки для локальной разработки
**Главное достижение:** Рабочий прототип с полным циклом авторизации