const http = require('http');
const https = require('https');
const crypto = require('crypto');

// Telegram Bot Configuration
const BOT_TOKEN = '8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s';
const WEBHOOK_PORT = 9002;
const WEBHOOK_PATH = '/telegram-webhook';
const DOMAIN = 'https://transformation-map.com';

// Функция для отправки сообщений в Telegram
function sendMessage(chatId, text, options = {}) {
  const data = JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    ...options
  });

  const req = https.request({
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  }, (res) => {
    console.log(`✅ Message sent, status: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error('❌ Error sending message:', error);
  });

  req.write(data);
  req.end();
}

// Обработка команды /start
function handleStartCommand(chatId, messageText, userInfo) {
  const welcomeText = `🎯 *Добро пожаловать в Transformation Map!*

Привет, ${userInfo.first_name}! 👋

🗺️ *Transformation Map* - это геймификированная платформа для личностных трансформаций.

🚀 *Что вы можете сделать:*
• Авторизоваться на сайте через Telegram
• Создать персональную карту трансформации
• Отслеживать прогресс достижения целей

🔗 *Перейти на сайт:* ${DOMAIN}

📱 *Команды бота:*
/help - помощь и список команд
/auth - получить ссылку для авторизации на сайте

Готовы начать свою трансформацию? 💪`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🌐 Открыть сайт',
          url: DOMAIN
        }
      ],
      [
        {
          text: '🔐 Авторизоваться',
          callback_data: 'auth_request'
        }
      ]
    ]
  };

  sendMessage(chatId, welcomeText, { reply_markup: keyboard });
}

// Обработка команды /help
function handleHelpCommand(chatId) {
  const helpText = `📖 *Помощь по боту Transformation Map*

🤖 *Доступные команды:*
/start - главное меню и приветствие
/help - эта справка
/auth - получить ссылку для авторизации

🌐 *Авторизация на сайте:*
1. Нажмите кнопку "Авторизоваться" 
2. Или перейдите на ${DOMAIN}
3. Используйте Telegram Login Widget

💡 *О проекте:*
Transformation Map помогает людям достигать целей через геймификацию и визуализацию прогресса.

❓ *Нужна помощь?*
Напишите /start для возврата в главное меню.`;

  sendMessage(chatId, helpText);
}

// Обработка команды /auth
function handleAuthCommand(chatId, userInfo) {
  const authToken = crypto.randomBytes(16).toString('hex');
  const authUrl = `${DOMAIN}/auth/login?telegram_user=${userInfo.id}&token=${authToken}`;
  
  const authText = `🔐 *Авторизация на сайте*

Для входа на сайт используйте одну из опций:

🔗 *Прямая ссылка:*
[Войти на сайт](${authUrl})

🌐 *Или перейдите на сайт:*
${DOMAIN}

📱 На сайте нажмите кнопку "Login with Telegram" и авторизуйтесь через виджет.

⏰ _Ссылка действительна 1 час_`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🔐 Войти на сайт',
          url: authUrl
        }
      ],
      [
        {
          text: '🌐 Открыть главную',
          url: DOMAIN
        }
      ]
    ]
  };

  sendMessage(chatId, authText, { reply_markup: keyboard });
}

// Обработка callback запросов (нажатия на inline кнопки)
function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const userInfo = callbackQuery.from;

  switch(data) {
    case 'auth_request':
      handleAuthCommand(chatId, userInfo);
      break;
    default:
      sendMessage(chatId, '❓ Неизвестная команда.');
  }
}

// Основная функция обработки сообщений
function handleMessage(update) {
  console.log('📨', JSON.stringify(update, null, 2));

  // Обработка callback queries (нажатия на inline кнопки)
  if (update.callback_query) {
    handleCallbackQuery(update.callback_query);
    return;
  }

  // Обработка обычных сообщений
  if (update.message) {
    const chatId = update.message.chat.id;
    const messageText = update.message.text;
    const userInfo = update.message.from;

    if (messageText.startsWith('/start')) {
      handleStartCommand(chatId, messageText, userInfo);
    } else if (messageText === '/help') {
      handleHelpCommand(chatId);
    } else if (messageText === '/auth') {
      handleAuthCommand(chatId, userInfo);
    } else {
      // Ответ на любое другое сообщение
      sendMessage(chatId, `
👋 Привет! Я бот Transformation Map.

Используйте команды:
/start - главное меню
/help - помощь
/auth - авторизация на сайте

Или перейдите на наш сайт: ${DOMAIN}
      `);
    }
  }
}

// Создание HTTP сервера для webhook
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === WEBHOOK_PATH) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        handleMessage(update);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok": true}');
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"ok": false, "error": "Invalid JSON"}');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Запуск сервера
server.listen(WEBHOOK_PORT, () => {
  console.log(`🤖 Telegram Bot webhook listening on port ${WEBHOOK_PORT}`);
  console.log(`📡 Webhook URL: ${DOMAIN}${WEBHOOK_PATH}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});