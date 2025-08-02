# 🤖 Инструкция для Claude

## 👋 **Привет! Если ты видишь это впервые:**

Ты работаешь с проектом **Transformation Map** - платформой для личностных трансформаций.

### 📍 **Где ты находишься:**
- **Директория:** `/var/www/transformation-map/`
- **Сервер:** Ubuntu, работает на https://transformation-map.com
- **Режим работы:** Разработка прямо на сервере в реальном времени

### 🎯 **Твоя роль:**
Помогаешь разрабатывать фичи, исправлять баги, улучшать UI/UX совместно с пользователем.

### 📚 **Обязательно прочитай:**
1. `PROJECT_STATUS.md` - полное описание проекта
2. `COMMANDS.md` - команды для работы  
3. `README.md` - техническая документация

### 🔧 **Важные команды:**
```bash
npm run save        # Сохранить изменения в Git
npm run dev:start   # Запустить dev режим
npm run prod:start  # Запустить продакшен
npm run pm2:status  # Проверить статус приложения
```

### 📁 **Ключевые файлы:**
- `app/[locale]/page.tsx` - главная страница
- `components/` - React компоненты
- `app/api/` - API endpoints
- `.env.production` - переменные окружения

### 🚀 **Workflow:**
1. Пользователь говорит что нужно сделать
2. Ты анализируешь код (Glob, Grep, Read)
3. Планируешь изменения (TodoWrite)
4. Реализуешь (Edit/Write)
5. Сохраняешь (`npm run save`)

### ⚡ **Стек технологий:**
- Next.js 15 + TypeScript
- Tailwind CSS + Shadcn/ui
- NextAuth + Telegram Auth
- next-intl (ru/en)
- PM2 + Nginx

## 🏗️ **Архитектура проекта (ПОНИМАНИЕ):**

### **Что такое Transformation Map:**
Геймификированная платформа для личностных трансформаций с Telegram авторизацией.

### **Главные компоненты:**
- **`app/[locale]/page.tsx`** - Landing page с AnimatedBackground и кнопкой "Начать"
- **`components/AnimatedBackground.tsx`** - анимированный фон главной страницы
- **`components/ui/`** - UI компоненты (Button, Card, Input и т.д.)
- **`app/api/auth/`** - NextAuth endpoints для авторизации
- **`app/api/telegram-verification/`** - API для Telegram бота
- **`messages/ru.json, en.json`** - переводы для интернационализации

### **Технический стек (из package.json):**
- **Next.js 15** с App Router - основной фреймворк
- **TypeScript** - типизация
- **NextAuth 5.0** - авторизация
- **next-intl** - интернационализация (ru/en)
- **Supabase** - база данных и авторизация
- **Telegram Bot API** - интеграция с ботом
- **Tailwind CSS** - стили
- **Radix UI** - UI компоненты
- **PM2** - процесс-менеджер для продакшена

### **Команды для бота:**
- `npm run bot:start` - запуск Telegram бота
- `npm run bot:setup` - настройка webhook
- `npm run bot:status` - статус webhook
- `pm2 restart telegram-verification-bot` - перезапуск бота

### **Понимание workflow:**
1. Пользователь заходит на главную (`page.tsx`)
2. Нажимает "Начать" → переходит на `/auth/login`
3. Авторизуется через Telegram
4. Попадает на защищенные страницы (`/protected/`)

### **Файловая структура:**
```
app/[locale]/           # Страницы с локализацией
├── page.tsx           # Главная страница
├── auth/              # Страницы авторизации
│   ├── login/         # Вход
│   ├── sign-up/       # Регистрация
│   └── confirm/       # Подтверждение
├── protected/         # Защищенные страницы
└── layout.tsx         # Общий layout

app/api/               # API endpoints
├── auth/              # NextAuth
├── telegram-verification/ # Telegram бот
└── telegram/          # Telegram интеграция

components/            # React компоненты
├── ui/               # UI библиотека
├── AnimatedBackground.tsx
├── LanguageSwitcher.tsx
└── theme-switcher.tsx
```

## 🔧 **Рабочие решения (ВАЖНЫЕ ФИКСЫ):**

### **Проблемы с обновлением изменений:**
Если изменения не отображаются на сайте:
```bash
# 1. Полная перезагрузка приложения
pm2 stop transformation-map
rm -rf .next
npm run build
pm2 start transformation-map

# 2. Проверить размер бандла (должен изменяться)
# В выводе build смотри Size колонку для [locale]/auth/login

# 3. Проверить что изменения есть в HTML
curl -s https://transformation-map.com/ru/auth/login | grep "искомый текст"
```

### **Исправление AuthJS UntrustedHost ошибки:**
В `lib/auth.ts` добавить:
```typescript
const config: NextAuthConfig = {
  trustHost: true,  // ← ОБЯЗАТЕЛЬНО для production
  providers: [...]
}
```

### **Локализация компонентов:**
Всегда использовать `useTranslations` для клиентских компонентов:
```typescript
import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('Auth');
  return <span>{t('key')}</span>; // НЕ хардкодить текст!
}
```

### **Навигация с локализацией:**
```typescript
import { useRouter, useParams } from 'next/navigation';

const router = useRouter();
const params = useParams();
const locale = params.locale as string;

const handleClick = () => {
  router.push(`/${locale}/page`); // Всегда добавлять locale!
};
```

### **Кликабельные кнопки (важно!):**
Если кнопка не кликается, добавить:
```typescript
<Button
  onClick={handleClick}
  className="cursor-pointer z-10 relative" // ← z-index и cursor обязательны
  type="button" // ← явный тип
>
```

### **Структура переводов:**
Добавлять в `messages/ru.json` и `messages/en.json`:
```json
{
  "Auth": {
    "backToHome": "На главную", // ru
    "backToHome": "Back to Home" // en
  }
}
```

### **Проверка PM2 логов:**
```bash
pm2 logs --lines 50  # Проверить ошибки
pm2 status           # Статус процессов
```

## 🔒 **Telegram Bot Security (НОВОЕ - 02.08.2025):**

### **Система повторных попыток капчи с блокировкой:**
Реализована защита от автоматических атак на этапе капчи:

**Логика работы:**
- **1-я ошибка:** "Попробуйте еще раз"
- **2-я ошибка:** "Осталась 1 попытка"  
- **3-я ошибка:** "Блокировка на 5 минут"

**Файлы с изменениями:**
- `telegram-verification-bot.js:100-180` - новые методы UserSessionService
- `telegram-verification-bot.js:925-1030` - обновленная логика капчи
- Поля сессии: `captcha_attempts`, `captcha_blocked_until`

**Методы для работы с блокировкой:**
```javascript
UserSessionService.isCaptchaBlocked(userId)      // Проверка блокировки
UserSessionService.incrementCaptchaAttempts(userId) // +1 попытка
UserSessionService.blockCaptcha(userId)          // Блок на 5 минут
UserSessionService.getCaptchaBlockTimeLeft(userId)  // Время до разблока
```

**Аналитика:**
- Новый тип ошибки `captcha_blocked` в `bot-analytics.json`
- Отслеживание всех попыток и блокировок

**Защита от обхода:**
- Проверка блокировки при показе капчи
- Проверка блокировки при ответе
- Автосброс счетчика при успехе

**Теперь ты полностью понимаешь проект и знаешь все важные фиксы! 🎯**