# 🔐 План реализации входа на сайт после Telegram верификации

## 🎯 Цель
Реализовать полный цикл авторизации: Telegram бот → расшифровка токена → создание сессии → личный кабинет

---

## 📋 Этапы реализации

### **ЭТАП 1: Настройка базы данных Supabase**
**Время:** 30-45 минут

#### 1.1 Создание таблиц в Supabase
```sql
-- Таблица пользователей
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255),
  username VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'ru',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Индексы для производительности
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 1.2 Настройка NextAuth.js схемы
- Добавить NextAuth.js таблицы через Supabase SQL Editor
- Использовать официальную схему NextAuth.js v5
- Настроить RLS политики

#### 1.3 Обновление переменных окружения
```env
# Добавить в .env.production
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

---

### **ЭТАП 2: Настройка NextAuth.js v5 с Supabase**
**Время:** 45-60 минут

#### 2.1 Установка зависимостей
```bash
npm install next-auth@beta @auth/supabase-adapter crypto-js
```

#### 2.2 Создание конфигурации NextAuth.js
**Файл:** `lib/auth.ts`
- Настроить SupabaseAdapter
- Добавить Credentials Provider для Telegram
- Настроить callbacks для JWT и session
- Настроить 30-дневные сессии

#### 2.3 Создание API routes
**Файл:** `app/api/auth/[...nextauth]/route.ts`
- Экспорт handlers из auth.ts
- Поддержка GET и POST методов

---

### **ЭТАП 3: Страница обработки токена**
**Время:** 60-90 минут

#### 3.1 Создание страницы telegram-verified
**Файл:** `app/[locale]/auth/telegram-verified/page.tsx`

**Функционал:**
- Извлечение токена из URL searchParams
- Расшифровка AES-256 токена (используя тот же ключ что в боте)
- Проверка валидности токена и времени жизни
- Автоматический вход через NextAuth signIn()
- Redirect на профиль

**Структура компонента:**
```typescript
'use client'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AES, enc } from 'crypto-js'
import { Suspense, useEffect } from 'react'

function TelegramVerified() {
  // Логика расшифровки и входа
}

export default function Page() {
  return (
    <Suspense fallback={<div>Завершение авторизации...</div>}>
      <TelegramVerified />
    </Suspense>
  )
}
```

#### 3.2 Создание API endpoint для верификации
**Файл:** `app/api/telegram-verify/route.ts`
- Принимать расшифрованные данные пользователя
- Проверять/создавать пользователя в БД
- Возвращать результат для NextAuth

---

### **ЭТАП 4: Личный кабинет пользователя**
**Время:** 45-60 минут

#### 4.1 Создание страницы профиля
**Файл:** `app/[locale]/profile/page.tsx`

**Функционал:**
- Проверка авторизации через NextAuth
- Получение данных пользователя из сессии
- Отображение приветствия с именем из Telegram
- Онбординг для новых пользователей (welcome=true)
- Обычный профиль для существующих

#### 4.2 Структура профиля
- **Новый пользователь:** Онбординг + приветствие + что можно делать
- **Существующий:** Обычный профиль с данными и навигацией

#### 4.3 Защита страницы
- Middleware для проверки авторизации
- Redirect неавторизованных на /auth/login

---

### **ЭТАП 5: Обновление существующих компонентов**
**Время:** 30-45 минут

#### 5.1 Обновление Credentials Provider в auth.ts
- Добавить логику для telegram provider
- Настроить authorize function для обработки Telegram данных

#### 5.2 Обновление кнопки входа
**Файл:** `components/telegram-register-button.tsx`
- Убедиться что правильно открывает бота
- Проверить что ссылка возврата корректная

#### 5.3 Добавление переводов
**Файлы:** `messages/ru.json`, `messages/en.json`
- Добавить тексты для страницы профиля
- Добавить тексты онбординга
- Добавить сообщения об ошибках

---

### **ЭТАП 6: Тестирование и отладка**
**Время:** 45-60 минут

#### 6.1 Тестирование полного цикла
1. Нажатие кнопки "Войти через Telegram"
2. Прохождение верификации в боте
3. Клик по ссылке возврата
4. Успешное создание сессии
5. Попадание в личный кабинет

#### 6.2 Тестирование повторных входов
1. Закрыть браузер
2. Открыть сайт снова
3. Проверить автоматическую авторизацию
4. Попадание в профиль без бота

#### 6.3 Тестирование ошибок
- Невалидный токен
- Истекший токен
- Проблемы с БД
- Проблемы с NextAuth

---

## 🗂️ Файлы для создания/изменения

### Новые файлы:
- `vxodsait.md` ✅ (этот план)
- `app/[locale]/auth/telegram-verified/page.tsx`
- `app/[locale]/profile/page.tsx`
- `app/api/telegram-verify/route.ts`
- `app/api/auth/[...nextauth]/route.ts`

### Изменения в существующих:
- `lib/auth.ts` (обновить конфигурацию)
- `messages/ru.json` + `messages/en.json` (переводы)
- `.env.production` (переменные Supabase)
- `package.json` (новые зависимости)

---

## 🔧 Технические детали

### Используемые технологии:
- **NextAuth.js v5** с SupabaseAdapter
- **Supabase PostgreSQL** для хранения пользователей
- **crypto-js** для расшифровки AES-256 токенов
- **Next.js App Router** для роутинга
- **TypeScript** для типизации

### Безопасность:
- AES-256 шифрование токенов
- 30-дневные сессии NextAuth
- RLS политики в Supabase
- Проверка времени жизни токенов
- HTTPS обязательно

### UX Flow:
```
Кнопка Telegram → Бот → Верификация → Ссылка → 
Расшифровка → NextAuth → БД → Сессия → Профиль
```

---

## ✅ Критерии готовности

- [ ] База данных настроена
- [ ] NextAuth.js v5 работает с Supabase
- [ ] Страница telegram-verified расшифровывает токены
- [ ] Пользователи создаются/обновляются в БД
- [ ] Сессии работают 30 дней
- [ ] Профиль показывает данные пользователя
- [ ] Онбординг работает для новых пользователей
- [ ] Повторные входы автоматические
- [ ] Все ошибки обрабатываются корректно

---

**🚀 Готов к реализации по этапам!**