# 🌐 Руководство по Интернационализации

Этот документ описывает, как правильно добавлять многоязычный контент в проект Transformation Map App.

---

## 🎯 Основные принципы

### 1. Все тексты только в файлах переводов
Никогда не хардкодьте тексты прямо в компонентах. Все строки должны находиться в файлах переводов.

```json
// ✅ Правильно - в messages/ru.json
{
  "HomePage": {
    "title": "Карта трансформации",
    "subtitle": "Геймифицируйте свой путь к лучшей версии себя"
  }
}

// ❌ Неправильно - прямо в JSX
<h1>Карта трансформации</h1>
```

### 2. Структура файлов переводов
Файлы переводов находятся в папке `messages/`:
- `messages/ru.json` - русские переводы (основной язык)
- `messages/en.json` - английские переводы

### 3. Группировка по функциональности
Организуйте переводы по логическим группам:

```json
{
  "Auth": {
    "login": "Войти",
    "signup": "Регистрация",
    "forgotPassword": "Забыли пароль?"
  },
  "Dashboard": {
    "welcome": "Добро пожаловать",
    "statistics": "Статистика"
  },
  "Profile": {
    "editProfile": "Редактировать профиль",
    "settings": "Настройки"
  }
}
```

---

## 🛠️ Как использовать переводы

### В серверных компонентах
```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('HomePage');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

### В клиентских компонентах
```tsx
'use client';
import { useTranslations } from 'next-intl';

export function ClientComponent() {
  const t = useTranslations('Auth');
  
  return (
    <button>{t('login')}</button>
  );
}
```

### Передача локали в getTranslations (если нужно)
```tsx
export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'HomePage'});
  
  return <h1>{t('title')}</h1>;
}
```

---

## 📋 Чек-лист для добавления нового контента

### ✅ Обязательные шаги:
1. **Добавить ключи в оба файла** (`ru.json` и `en.json`)
2. **Использовать осмысленные названия ключей** (`auth.loginButton` вместо `button1`)
3. **Группировать по функциональности** (Auth, Dashboard, Profile, etc.)
4. **Проверить отображение на обоих языках**
5. **Убедиться, что переводы корректны и понятны**

### 🔍 Проверка:
- Откройте `/ru` и `/en` - все тексты отображаются?
- Переключите язык через кнопку в углу - все работает?
- Нет ли где-то жестко прописанных строк?

---

## 💡 Практические примеры

### Простая страница профиля
```json
// messages/ru.json
{
  "Profile": {
    "title": "Профиль пользователя",
    "personalInfo": "Личная информация",
    "name": "Имя",
    "email": "Email",
    "phone": "Телефон",
    "saveButton": "Сохранить изменения",
    "cancelButton": "Отмена",
    "deleteAccount": "Удалить аккаунт",
    "confirmDelete": "Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить."
  }
}

// messages/en.json
{
  "Profile": {
    "title": "User Profile",
    "personalInfo": "Personal Information",
    "name": "Name",
    "email": "Email", 
    "phone": "Phone",
    "saveButton": "Save Changes",
    "cancelButton": "Cancel",
    "deleteAccount": "Delete Account",
    "confirmDelete": "Are you sure you want to delete your account? This action cannot be undone."
  }
}
```

### Форма с валидацией
```json
{
  "Validation": {
    "required": "Поле обязательно для заполнения",
    "emailInvalid": "Неверный формат email",
    "passwordTooShort": "Пароль должен содержать минимум 8 символов",
    "passwordsNotMatch": "Пароли не совпадают",
    "phoneInvalid": "Неверный формат номера телефона"
  }
}
```

### Динамический контент с переменными
```json
{
  "Dashboard": {
    "welcomeUser": "Добро пожаловать, {name}!",
    "tasksCompleted": "Выполнено задач: {count}",
    "progressPercent": "Прогресс: {percent}%",
    "dayStreak": "{days, plural, =0 {Начните серию!} =1 {# день подряд} few {# дня подряд} other {# дней подряд}}"
  }
}
```

Использование:
```tsx
const t = useTranslations('Dashboard');

// Простая переменная
<h1>{t('welcomeUser', {name: 'Иван'})}</h1>

// Плюрализация
<p>{t('dayStreak', {days: streak})}</p>
```

### Уведомления и сообщения
```json
{
  "Notifications": {
    "success": {
      "profileUpdated": "Профиль успешно обновлен",
      "passwordChanged": "Пароль изменен",
      "dataExported": "Данные экспортированы"
    },
    "error": {
      "networkError": "Ошибка сети. Попробуйте позже",
      "unauthorizedAccess": "Нет доступа к этой странице",
      "fileUploadFailed": "Не удалось загрузить файл"
    },
    "info": {
      "dataLoading": "Загружаем данные...",
      "changesSaved": "Изменения сохранены автоматически"
    }
  }
}
```

---

## ⚠️ Что НЕ делать

### ❌ Неправильно:
```tsx
// Хардкод текста
<button>Войти</button>

// Смешивание языков
<div>
  <h1>{t('title')}</h1>
  <p>This is hardcoded text</p>
</div>

// Плохие названия ключей
{
  "text1": "Какой-то текст",
  "btn": "Кнопка",
  "msg": "Сообщение"
}
```

### ✅ Правильно:
```tsx
// Все через переводы
const t = useTranslations('Auth');
<button>{t('loginButton')}</button>

// Осмысленные ключи
{
  "Auth": {
    "loginButton": "Войти",
    "signupButton": "Регистрация",
    "forgotPasswordLink": "Забыли пароль?"
  }
}
```

---

## 🔄 Workflow для команды

1. **Разработчик:**
   - Добавляет новые ключи в `ru.json` (основной язык)
   - Использует переводы в компонентах
   - Тестирует на русском языке

2. **Переводчик/Локализатор:**
   - Добавляет переводы в `en.json`
   - Проверяет контекст и корректность переводов

3. **Тестировщик:**
   - Проверяет оба языка (`/ru` и `/en`)
   - Убеждается, что переключение языка работает
   - Проверяет, что все тексты переведены

4. **Деплой:**
   - Только после проверки всех переводов
   - Убедиться, что нет missing keys

---

## 🚀 Полезные советы

### Именование ключей
- Используйте camelCase: `loginButton`, `resetPassword`
- Группируйте логически: `auth.login`, `profile.edit`
- Добавляйте контекст: `deleteButton` → `profile.deleteAccountButton`

### Длинные тексты
```json
{
  "Legal": {
    "privacyPolicy": "Наша политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу личную информацию...",
    "termsOfService": "Используя наш сервис, вы соглашаетесь с данными условиями использования..."
  }
}
```

### Переводы для SEO
```json
{
  "Meta": {
    "homepage": {
      "title": "Карта Трансформации - Геймификация Целей",
      "description": "Превратите свои цели в увлекательную игру. Визуальная карта прогресса для достижения результатов."
    }
  }
}
```

---

## 🔧 Отладка

### Проверка отсутствующих переводов
Если видите ключ вместо текста (`HomePage.title`), значит:
1. Ключ отсутствует в файле переводов
2. Неправильное название namespace
3. Ошибка в пути к ключу

### Инструменты разработки
- Откройте DevTools → Console для ошибок next-intl
- Проверьте Network tab на загрузку JSON файлов
- Используйте React DevTools для проверки props

---

*Этот документ должен обновляться при добавлении новых паттернов использования интернационализации.*