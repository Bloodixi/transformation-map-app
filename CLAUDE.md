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

**Теперь ты полностью понимаешь проект! Приступай к работе! 🎯**