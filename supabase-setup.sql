-- 🗄️ Суперпродукт: Настройка базы данных Supabase
-- Этап 1.1: Создание таблиц для авторизации через Telegram

-- ==========================================
-- 📋 ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
-- ==========================================

-- Создаем таблицу пользователей с полями Telegram
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'ru',
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  -- Дополнительные поля для профиля
  is_active BOOLEAN DEFAULT TRUE,
  timezone VARCHAR(50) DEFAULT 'Europe/Moscow'
);

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ==========================================
-- 🔐 NEXTAUTH.JS СХЕМА
-- ==========================================

-- Таблица аккаунтов (для OAuth провайдеров)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Таблица сессий
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица токенов верификации
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (identifier, token)
);

-- Индексы для NextAuth.js
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- ==========================================
-- 🛡️ ROW LEVEL SECURITY (RLS) ПОЛИТИКИ
-- ==========================================

-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы users
-- Пользователи могут читать только свои данные
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = telegram_id::text);

-- Пользователи могут обновлять только свои данные
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = telegram_id::text);

-- Service role может делать все
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Политики для NextAuth.js таблиц
-- Только service role может управлять NextAuth таблицами
CREATE POLICY "Service role can manage accounts" ON accounts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage sessions" ON sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage verification tokens" ON verification_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 📊 ФУНКЦИИ И ТРИГГЕРЫ
-- ==========================================

-- Функция для обновления поля updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для обновления last_login при входе
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_login = NOW() WHERE telegram_id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления last_login при создании сессии
CREATE TRIGGER update_last_login_on_session_create
    AFTER INSERT ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_user_last_login();

-- ==========================================
-- ✅ ГОТОВО!
-- ==========================================

-- Выводим информацию о созданных таблицах
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('users', 'accounts', 'sessions', 'verification_tokens')
    AND schemaname = 'public'
ORDER BY tablename;

-- Выводим количество записей в каждой таблице
SELECT 
    'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 
    'accounts' as table_name, COUNT(*) as records FROM accounts
UNION ALL
SELECT 
    'sessions' as table_name, COUNT(*) as records FROM sessions
UNION ALL
SELECT 
    'verification_tokens' as table_name, COUNT(*) as records FROM verification_tokens;