# 🗄️ Инструкции по настройке Supabase

## ✅ Что уже готово:

1. **SQL скрипт создан** - `supabase-setup.sql`
2. **NextAuth.js обновлен** - интеграция с Supabase адаптером
3. **Переменные окружения добавлены** - в `.env.production`
4. **Зависимости установлены** - `@auth/supabase-adapter`

## 🔧 Что нужно сделать вручную:

### 1. Создать проект в Supabase
1. Перейти на https://supabase.com
2. Создать новый проект
3. Выбрать регион (Europe West - Ireland рекомендуется)
4. Записать URL проекта и ключи

### 2. Выполнить SQL скрипт
1. Открыть SQL Editor в Supabase Dashboard
2. Скопировать и выполнить содержимое файла `supabase-setup.sql`
3. Проверить, что все таблицы созданы:
   - `users`
   - `accounts` 
   - `sessions`
   - `verification_tokens`

### 3. Обновить переменные окружения
Заменить в `.env.production`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Где найти ключи:**
- URL: Settings → General → Reference ID
- Public Key: Settings → API → Project API keys → anon public
- Service Role Key: Settings → API → Project API keys → service_role

### 4. Настроить RLS политики (опционально)
SQL скрипт уже содержит базовые RLS политики, но можно дополнительно настроить:

1. **Политики чтения** - пользователи видят только свои данные
2. **Политики записи** - пользователи могут изменять только свои данные  
3. **Service role** - полный доступ для NextAuth.js

### 5. Проверить работу
После настройки:

1. Перезапустить приложение: `npm run prod:start`
2. Протестировать вход через Telegram
3. Проверить создание записей в таблице `users`
4. Проверить создание сессий в таблице `sessions`

## 📊 Структура данных

### Таблица `users`
- `id` - первичный ключ
- `telegram_id` - ID пользователя Telegram
- `first_name`, `last_name`, `username` - данные из Telegram
- `language_code` - язык интерфейса ('ru'/'en')
- `photo_url` - аватар из Telegram
- `onboarding_completed` - прошел ли онбординг
- `created_at`, `last_login` - временные метки

### NextAuth.js таблицы
- `accounts` - связь с провайдерами авторизации
- `sessions` - активные сессии пользователей (30 дней)
- `verification_tokens` - токены верификации

## 🔐 Безопасность

1. **RLS включен** для всех таблиц
2. **Service role** используется только для NextAuth.js операций
3. **Anon key** используется для клиентских операций
4. **30-дневные сессии** автоматически очищаются

## 🐛 Возможные проблемы

1. **Ошибка подключения** - проверить URL и ключи
2. **Ошибки RLS** - убедиться что политики настроены
3. **Ошибки NextAuth** - проверить что адаптер настроен правильно

## 📝 Следующие этапы

После успешной настройки Supabase можно переходить к:
- Этап 2: Создание страницы telegram-verified
- Этап 3: Создание страницы профиля
- Этап 4: Тестирование полного цикла

---

**🚀 Готово к настройке Supabase!**