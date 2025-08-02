const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ========== КОНФИГУРАЦИЯ ==========
const CONFIG = {
  // Telegram Bot
  BOT_TOKEN: '8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s',
  WEBHOOK_PORT: 9003,
  WEBHOOK_PATH: '/telegram-verification-webhook',
  DOMAIN: 'https://transformation-map.com',
  
  // Группа для верификации
  COMMUNITY_GROUP: '@transformation_map_community',
  COMMUNITY_GROUP_ID: '-1002710202308', // Реальный ID группы transformation_map_community
  
  // Безопасность
  ENCRYPTION_KEY: crypto.randomBytes(32), // AES-256 ключ
  ENCRYPTION_IV_LENGTH: 16,
  TOKEN_LIFETIME: 30 * 60 * 1000, // 30 минут
  ACCOUNT_MIN_AGE: 7 * 24 * 60 * 60, // 7 дней в секундах
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 минута
  RATE_LIMIT_MAX: 5, // 5 запросов в минуту
  MAX_ATTEMPTS_PER_HOUR: 3,
  RETRY_COOLDOWN: 60 * 60 * 1000, // 1 час
  
  // Файлы данных
  ANALYTICS_FILE: path.join(__dirname, 'bot-analytics.json'),
  RATE_LIMIT_FILE: path.join(__dirname, 'bot-rate-limits.json'),
  ATTEMPTS_FILE: path.join(__dirname, 'bot-attempts.json')
};

// ========== СОСТОЯНИЯ ПОЛЬЗОВАТЕЛЯ ==========
const USER_STATES = {
  NEW: 'new',
  TERMS_SHOWN: 'terms_shown',
  TERMS_ACCEPTED: 'terms_accepted',
  GROUP_JOIN_REQUESTED: 'group_join_requested',
  CAPTCHA_SHOWN: 'captcha_shown',
  VERIFICATION_COMPLETED: 'verification_completed',
  BLOCKED: 'blocked'
};

// ========== СИСТЕМА ШИФРОВАНИЯ ==========
class EncryptionService {
  static encrypt(text) {
    const iv = crypto.randomBytes(CONFIG.ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', CONFIG.ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      data: encrypted
    };
  }
  
  static decrypt(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', CONFIG.ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  static createVerificationToken(telegramId, timestamp) {
    const payload = JSON.stringify({
      telegram_id: telegramId,
      timestamp: timestamp,
      expires_at: timestamp + CONFIG.TOKEN_LIFETIME
    });
    
    return this.encrypt(payload);
  }
}

// ========== СИСТЕМА RATE LIMITING ==========
class RateLimitService {
  static loadData() {
    try {
      if (fs.existsSync(CONFIG.RATE_LIMIT_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG.RATE_LIMIT_FILE, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading rate limit data:', error);
    }
    return {};
  }
  
  static saveData(data) {
    try {
      fs.writeFileSync(CONFIG.RATE_LIMIT_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving rate limit data:', error);
    }
  }
  
  static checkRateLimit(userId) {
    const data = this.loadData();
    const now = Date.now();
    const userKey = userId.toString();
    
    if (!data[userKey]) {
      data[userKey] = { requests: [], blocked_until: 0 };
    }
    
    const user = data[userKey];
    
    // Проверяем блокировку
    if (user.blocked_until > now) {
      return {
        allowed: false,
        reason: 'rate_limited',
        retry_after: Math.ceil((user.blocked_until - now) / 1000)
      };
    }
    
    // Очищаем старые запросы
    user.requests = user.requests.filter(req => now - req < CONFIG.RATE_LIMIT_WINDOW);
    
    // Проверяем лимит
    if (user.requests.length >= CONFIG.RATE_LIMIT_MAX) {
      user.blocked_until = now + CONFIG.RETRY_COOLDOWN;
      this.saveData(data);
      
      return {
        allowed: false,
        reason: 'rate_limited',
        retry_after: Math.ceil(CONFIG.RETRY_COOLDOWN / 1000)
      };
    }
    
    // Добавляем новый запрос
    user.requests.push(now);
    this.saveData(data);
    
    return { allowed: true };
  }
}

// ========== СИСТЕМА ПОПЫТОК ==========
class AttemptsService {
  static loadData() {
    try {
      if (fs.existsSync(CONFIG.ATTEMPTS_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG.ATTEMPTS_FILE, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading attempts data:', error);
    }
    return {};
  }
  
  static saveData(data) {
    try {
      fs.writeFileSync(CONFIG.ATTEMPTS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving attempts data:', error);
    }
  }
  
  static checkAttempts(userId) {
    const data = this.loadData();
    const now = Date.now();
    const userKey = userId.toString();
    
    if (!data[userKey]) {
      data[userKey] = { attempts: 0, last_attempt: 0, blocked_until: 0 };
    }
    
    const user = data[userKey];
    
    // Сбрасываем счетчик каждый час
    if (now - user.last_attempt > CONFIG.RETRY_COOLDOWN) {
      user.attempts = 0;
    }
    
    // Проверяем блокировку
    if (user.blocked_until > now) {
      return {
        allowed: false,
        reason: 'too_many_attempts',
        retry_after: Math.ceil((user.blocked_until - now) / 1000)
      };
    }
    
    // Проверяем лимит попыток
    if (user.attempts >= CONFIG.MAX_ATTEMPTS_PER_HOUR) {
      user.blocked_until = now + CONFIG.RETRY_COOLDOWN;
      this.saveData(data);
      
      return {
        allowed: false,
        reason: 'too_many_attempts',
        retry_after: Math.ceil(CONFIG.RETRY_COOLDOWN / 1000)
      };
    }
    
    return { allowed: true };
  }
  
  static incrementAttempts(userId) {
    const data = this.loadData();
    const now = Date.now();
    const userKey = userId.toString();
    
    if (!data[userKey]) {
      data[userKey] = { attempts: 0, last_attempt: 0, blocked_until: 0 };
    }
    
    data[userKey].attempts++;
    data[userKey].last_attempt = now;
    
    this.saveData(data);
  }
}

// ========== АНАЛИТИКА ==========
class AnalyticsService {
  static loadData() {
    try {
      if (fs.existsSync(CONFIG.ANALYTICS_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG.ANALYTICS_FILE, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
    
    return {
      total_started: 0,
      stage_1_terms_shown: 0,
      stage_2_terms_accepted: 0,
      stage_3_group_requested: 0,
      stage_4_verification_completed: 0,
      failures: {
        rate_limited: 0,
        account_too_young: 0,
        not_in_group: 0,
        captcha_failed: 0,
        captcha_blocked: 0,
        too_many_attempts: 0
      },
      conversion_rates: {},
      avg_completion_time: 0,
      sessions: {}
    };
  }
  
  static saveData(data) {
    try {
      fs.writeFileSync(CONFIG.ANALYTICS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }
  
  static trackEvent(userId, event, additionalData = {}) {
    const data = this.loadData();
    const timestamp = Date.now();
    
    // Инициализируем сессию пользователя
    if (!data.sessions[userId]) {
      data.sessions[userId] = {
        started_at: timestamp,
        events: [],
        completed: false
      };
    }
    
    // Добавляем событие
    data.sessions[userId].events.push({
      event,
      timestamp,
      ...additionalData
    });
    
    // Обновляем общую статистику
    switch (event) {
      case 'started':
        data.total_started++;
        break;
      case 'terms_shown':
        data.stage_1_terms_shown++;
        break;
      case 'terms_accepted':
        data.stage_2_terms_accepted++;
        break;
      case 'group_requested':
        data.stage_3_group_requested++;
        break;
      case 'verification_completed':
        data.stage_4_verification_completed++;
        data.sessions[userId].completed = true;
        break;
      case 'failure':
        if (data.failures[additionalData.reason]) {
          data.failures[additionalData.reason]++;
        }
        break;
    }
    
    // Рассчитываем конверсию
    this.calculateConversionRates(data);
    
    this.saveData(data);
    
    console.log(`📊 Analytics: ${event} for user ${userId}`, additionalData);
  }
  
  static calculateConversionRates(data) {
    if (data.total_started > 0) {
      data.conversion_rates = {
        terms_shown: (data.stage_1_terms_shown / data.total_started * 100).toFixed(2),
        terms_accepted: (data.stage_2_terms_accepted / data.total_started * 100).toFixed(2),
        group_requested: (data.stage_3_group_requested / data.total_started * 100).toFixed(2),
        completed: (data.stage_4_verification_completed / data.total_started * 100).toFixed(2)
      };
    }
  }
  
  static getStats() {
    const data = this.loadData();
    this.calculateConversionRates(data);
    
    return {
      overview: {
        total_started: data.total_started,
        completed: data.stage_4_verification_completed,
        completion_rate: data.conversion_rates.completed + '%'
      },
      stages: {
        '1_terms_shown': data.stage_1_terms_shown,
        '2_terms_accepted': data.stage_2_terms_accepted,
        '3_group_requested': data.stage_3_group_requested,
        '4_completed': data.stage_4_verification_completed
      },
      conversion_rates: data.conversion_rates,
      failures: data.failures
    };
  }
}

// ========== TELEGRAM API ==========
class TelegramAPI {
  static async makeRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(params);
      
      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${CONFIG.BOT_TOKEN}/${method}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(postData, 'utf8')
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.ok) {
              resolve(result.result);
            } else {
              reject(new Error(`Telegram API Error: ${result.description}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData, 'utf8');
      req.end();
    });
  }
  
  static async sendMessage(chatId, text, options = {}) {
    try {
      console.log(`🔍 Sending message to ${chatId}, text length: ${text ? text.length : 'undefined'}, text: "${text}"`);
      
      if (!text || text.trim() === '') {
        throw new Error('Message text is empty or undefined');
      }
      
      const response = await this.makeRequest('sendMessage', {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
      });

      // Отслеживаем сообщение бота для автоматического удаления
      if (response && response.message_id && typeof UserSessionService !== 'undefined') {
        UserSessionService.addBotMessage(chatId, response.message_id);
      }

      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  static async getChatMember(chatId, userId) {
    try {
      return await this.makeRequest('getChatMember', {
        chat_id: chatId,
        user_id: userId
      });
    } catch (error) {
      console.error('Error getting chat member:', error);
      throw error;
    }
  }
  
  static async getChat(chatId) {
    try {
      return await this.makeRequest('getChat', {
        chat_id: chatId
      });
    } catch (error) {
      console.error('Error getting chat:', error);
      throw error;
    }
  }
}

// ========== СИСТЕМА ПРОВЕРОК БЕЗОПАСНОСТИ ==========
class SecurityService {
  static async checkAccountAge(userInfo) {
    // Telegram не предоставляет дату создания аккаунта напрямую
    // Используем эвристики: проверяем ID пользователя и другие признаки
    const userId = parseInt(userInfo.id);
    
    // Пользователи с ID меньше определенного числа существуют дольше
    // Это приблизительная проверка
    const estimatedAge = this.estimateAccountAge(userId);
    
    return {
      valid: estimatedAge >= CONFIG.ACCOUNT_MIN_AGE,
      estimated_age_days: Math.floor(estimatedAge / (24 * 60 * 60)),
      reason: estimatedAge < CONFIG.ACCOUNT_MIN_AGE ? 'account_too_young' : null
    };
  }
  
  static estimateAccountAge(userId) {
    // Эвристика для оценки возраста аккаунта по ID
    // Telegram ID растут приблизительно по времени
    const baseTimestamp = 1380000000; // Примерно начало 2013 года
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Примерная оценка: более старые ID = более старые аккаунты
    if (userId < 100000000) return currentTimestamp - baseTimestamp; // Очень старый
    if (userId < 500000000) return 365 * 24 * 60 * 60; // Год+
    if (userId < 1000000000) return 180 * 24 * 60 * 60; // 6 месяцев+
    if (userId < 2000000000) return 90 * 24 * 60 * 60; // 3 месяца+
    if (userId < 5000000000) return 30 * 24 * 60 * 60; // Месяц+
    
    return 0; // Потенциально новый аккаунт
  }
  
  static async checkGroupMembership(userId) {
    try {
      const member = await TelegramAPI.getChatMember(CONFIG.COMMUNITY_GROUP_ID, userId);
      
      const validStatuses = ['member', 'administrator', 'creator'];
      const isValidMember = validStatuses.includes(member.status);
      
      return {
        valid: isValidMember,
        status: member.status,
        reason: !isValidMember ? 'not_in_group' : null
      };
    } catch (error) {
      console.error('Error checking group membership:', error);
      return {
        valid: false,
        status: 'unknown',
        reason: 'group_check_failed'
      };
    }
  }
  
  static hasRequiredUserData(userInfo) {
    return {
      valid: !!(userInfo.first_name && userInfo.id),
      missing_fields: [
        !userInfo.first_name && 'first_name',
        !userInfo.id && 'id'
      ].filter(Boolean),
      reason: (!userInfo.first_name || !userInfo.id) ? 'incomplete_profile' : null
    };
  }
}

// ========== СИСТЕМА КАПЧИ ==========
class CaptchaService {
  static generateMathCaptcha() {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        break;
    }
    
    return {
      question: `${num1} ${operation} ${num2} = ?`,
      answer: answer,
      options: this.generateCaptchaOptions(answer)
    };
  }
  
  static generateCaptchaOptions(correctAnswer) {
    const options = [correctAnswer];
    
    while (options.length < 4) {
      const wrongAnswer = correctAnswer + Math.floor(Math.random() * 20) - 10;
      if (wrongAnswer !== correctAnswer && wrongAnswer > 0 && !options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }
    
    // Перемешиваем опции
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
  }
}

// ========== ПОЛЬЗОВАТЕЛЬСКИЕ СЕССИИ ==========
class UserSessionService {
  static sessions = new Map();
  
  static createSession(userId, userInfo) {
    const session = {
      user_id: userId,
      user_info: userInfo,
      state: USER_STATES.NEW,
      started_at: Date.now(),
      current_step: 1,
      captcha_data: null,
      verification_token: null,
      last_activity: Date.now(),
      bot_messages: [], // ID сообщений бота для удаления
      user_messages: [], // ID сообщений пользователя для удаления
      auto_delete_enabled: true, // Автоматическое удаление включено
      captcha_attempts: 0, // Счетчик попыток капчи
      captcha_blocked_until: null // Время окончания блокировки
    };
    
    this.sessions.set(userId.toString(), session);
    return session;
  }
  
  static getSession(userId) {
    return this.sessions.get(userId.toString());
  }
  
  static updateSession(userId, updates) {
    const session = this.getSession(userId);
    if (session) {
      Object.assign(session, updates, { last_activity: Date.now() });
      this.sessions.set(userId.toString(), session);
    }
    return session;
  }
  
  static deleteSession(userId) {
    this.sessions.delete(userId.toString());
  }
  
  static cleanupOldSessions() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 час
    
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.last_activity > maxAge) {
        this.sessions.delete(userId);
        console.log(`🧹 Cleaned up old session for user ${userId}`);
      }
    }
  }

  // Методы для управления сообщениями
  static addBotMessage(userId, messageId) {
    const session = this.getSession(userId);
    if (session && session.auto_delete_enabled) {
      if (!session.bot_messages) session.bot_messages = [];
      session.bot_messages.push(messageId);
      console.log(`📝 Tracked bot message ${messageId} for user ${userId}`);
    }
  }

  static addUserMessage(userId, messageId) {
    const session = this.getSession(userId);
    if (session && session.auto_delete_enabled) {
      if (!session.user_messages) session.user_messages = [];
      session.user_messages.push(messageId);
      console.log(`📝 Tracked user message ${messageId} for user ${userId}`);
    }
  }

  static async deleteAllMessages(userId) {
    const session = this.getSession(userId);
    if (!session) return;

    console.log(`🗑 Starting message cleanup for user ${userId}`);
    
    const allMessages = [
      ...(session.bot_messages || []),
      ...(session.user_messages || [])
    ];

    let deletedCount = 0;
    for (const messageId of allMessages) {
      try {
        await TelegramAPI.makeRequest('deleteMessage', {
          chat_id: userId,
          message_id: messageId
        });
        deletedCount++;
      } catch (error) {
        console.log(`⚠️ Could not delete message ${messageId}: ${error.message}`);
      }
    }

    console.log(`🧹 Deleted ${deletedCount}/${allMessages.length} messages for user ${userId}`);
    
    // Очищаем списки сообщений
    session.bot_messages = [];
    session.user_messages = [];
  }

  static async deleteAllMessagesExceptLast(userId) {
    const session = this.getSession(userId);
    if (!session) return;

    console.log(`🗑 Cleaning chat for user ${userId}, keeping last message`);
    
    const allMessages = [
      ...(session.bot_messages || []).slice(0, -1), // Все кроме последнего сообщения бота
      ...(session.user_messages || []) // Все сообщения пользователя
    ];

    let deletedCount = 0;
    for (const messageId of allMessages) {
      try {
        await TelegramAPI.makeRequest('deleteMessage', {
          chat_id: userId,
          message_id: messageId
        });
        deletedCount++;
      } catch (error) {
        console.log(`⚠️ Could not delete message ${messageId}: ${error.message}`);
      }
    }

    console.log(`🧹 Deleted ${deletedCount}/${allMessages.length} old messages for user ${userId}`);
    
    // Оставляем только последнее сообщение бота
    session.bot_messages = session.bot_messages ? session.bot_messages.slice(-1) : [];
    session.user_messages = [];
  }

  static async cleanChatBeforeNewStep(userId) {
    // Удаляем ВСЕ предыдущие сообщения перед показом нового этапа
    await this.deleteAllMessages(userId);
  }

  static async cleanChatAfterNewStep(userId) {
    // Удаляем все сообщения кроме последнего (только что отправленного)
    await this.deleteAllMessagesExceptLast(userId);
  }

  // Методы для управления капчей
  static isCaptchaBlocked(userId) {
    const session = this.getSession(userId);
    if (!session || !session.captcha_blocked_until) return false;
    
    const now = Date.now();
    if (now < session.captcha_blocked_until) {
      return true; // Все еще заблокирован
    } else {
      // Блокировка истекла, сбрасываем
      session.captcha_blocked_until = null;
      session.captcha_attempts = 0;
      return false;
    }
  }

  static incrementCaptchaAttempts(userId) {
    const session = this.getSession(userId);
    if (!session) return 0;
    
    session.captcha_attempts = (session.captcha_attempts || 0) + 1;
    return session.captcha_attempts;
  }

  static blockCaptcha(userId) {
    const session = this.getSession(userId);
    if (!session) return;
    
    const blockDuration = 5 * 60 * 1000; // 5 минут
    session.captcha_blocked_until = Date.now() + blockDuration;
    console.log(`🚫 User ${userId} blocked from captcha for 5 minutes`);
  }

  static getCaptchaBlockTimeLeft(userId) {
    const session = this.getSession(userId);
    if (!session || !session.captcha_blocked_until) return 0;
    
    const timeLeft = session.captcha_blocked_until - Date.now();
    return Math.max(0, Math.ceil(timeLeft / 1000)); // в секундах
  }
}

// Очистка старых сессий каждые 10 минут
setInterval(() => {
  UserSessionService.cleanupOldSessions();
}, 10 * 60 * 1000);

// ========== UX И СООБЩЕНИЯ ==========
class MessageService {
  static getProgressBar(currentStep, totalSteps = 4) {
    const progress = Math.round((currentStep / totalSteps) * 100);
    const filledBars = Math.floor(progress / 10);
    const emptyBars = 10 - filledBars;
    
    const filled = '🟩'.repeat(filledBars);
    const empty = '⬜'.repeat(emptyBars);
    
    return `${filled}${empty} ${progress}% (${currentStep}/${totalSteps})`;
  }
  
  static getStepEmoji(step, currentStep) {
    if (step < currentStep) return '✅';
    if (step === currentStep) return '🔄';
    return '⏳';
  }
  
  static async sendStepMessage(chatId, step, content, options = {}) {
    const progressBar = this.getProgressBar(step);
    const stepEmojis = {
      1: '📋', 2: '👥', 3: '🔍', 4: '🎉'
    };
    
    const message = `${stepEmojis[step]} <b>Этап ${step}/4</b>\n\n${progressBar}\n\n${content}`;
    
    return await TelegramAPI.sendMessage(chatId, message, options);
  }
}

// ========== ОБРАБОТЧИКИ СООБЩЕНИЙ ==========
class MessageHandlers {
  static async handleStart(chatId, userInfo, startParam = null) {
    console.log(`🚀 Start command from user ${chatId}, param: ${startParam}`);
    
    // Проверяем параметр запуска
    if (startParam !== 'register') {
      const errorMessage = '❌ <b>Неверная ссылка</b>\n\nДля регистрации используйте ссылку с сайта transformation-map.com';
      console.log(`📤 Sending error message: "${errorMessage}"`);
      await TelegramAPI.sendMessage(chatId, errorMessage);
      return;
    }
    
    // Проверяем rate limiting
    const rateLimitCheck = RateLimitService.checkRateLimit(chatId);
    if (!rateLimitCheck.allowed) {
      await this.handleRateLimitError(chatId, rateLimitCheck);
      return;
    }
    
    // Проверяем количество попыток
    const attemptsCheck = AttemptsService.checkAttempts(chatId);
    if (!attemptsCheck.allowed) {
      await this.handleAttemptsError(chatId, attemptsCheck);
      return;
    }
    
    // Создаем или обновляем сессию
    let session = UserSessionService.getSession(chatId);
    if (!session) {
      session = UserSessionService.createSession(chatId, userInfo);
      AnalyticsService.trackEvent(chatId, 'started', { user_info: userInfo });
    }
    
    // Показываем условия регистрации
    await this.showTermsAndConditions(chatId, session);
  }
  
  static async showTermsAndConditions(chatId, session) {
    const content = `<b>Добро пожаловать в Transformation Map!</b>\n\n<b>🔒 Информация о конфиденциальности:</b>\n• Мы собираем только ваш Telegram ID, имя пользователя и имя для создания учетной записи\n• Данные используются исключительно для авторизации и персонализации опыта\n• Информация защищена шифрованием и хранится безопасно\n• Подробности в политике конфиденциальности: https://transformation-map.com\n\n<b>🛡 Права доступа бота:</b>\n• Отправка личных сообщений для процесса верификации\n• Проверка участия в группе сообщества\n• Создание защищенной ссылки для входа на сайт\n• Временное хранение данных верификации (30 минут)\n\n<b>📋 Процесс верификации:</b>\n${MessageService.getStepEmoji(1, 1)} <b>Принятие условий использования</b>\n${MessageService.getStepEmoji(2, 1)} Вступление в сообщество\n${MessageService.getStepEmoji(3, 1)} Проверка безопасности\n${MessageService.getStepEmoji(4, 1)} Получение ссылки для входа\n\n<b>⚡ Требования:</b>\n• Возраст аккаунта Telegram: минимум 7 дней\n• Участие в группе сообщества\n• Прохождение проверки безопасности\n\n<i>⏱ Процесс займет 2-3 минуты. Продолжая, вы соглашаетесь с обработкой ваших данных.</i>`;
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '✅ Принимаю условия', callback_data: 'accept_terms' }],
        [{ text: '❌ Отмена', callback_data: 'cancel_verification' }]
      ]
    };
    
    await MessageService.sendStepMessage(chatId, 1, content, { reply_markup: keyboard });
    
    UserSessionService.updateSession(chatId, {
      state: USER_STATES.TERMS_SHOWN,
      current_step: 1
    });
    
    AnalyticsService.trackEvent(chatId, 'terms_shown');
    
    // Очищаем чат, оставляя только сообщение с условиями
    await UserSessionService.cleanChatAfterNewStep(chatId);
  }
  
  static async handleTermsAccepted(chatId) {
    const session = UserSessionService.getSession(chatId);
    if (!session || session.state !== USER_STATES.TERMS_SHOWN) {
      await TelegramAPI.sendMessage(chatId, '❌ Ошибка: неверное состояние сессии');
      return;
    }
    
    // Проверяем возраст аккаунта
    const ageCheck = await SecurityService.checkAccountAge(session.user_info);
    if (!ageCheck.valid) {
      await this.handleSecurityError(chatId, 'account_too_young', ageCheck);
      return;
    }
    
    UserSessionService.updateSession(chatId, {
      state: USER_STATES.TERMS_ACCEPTED,
      current_step: 2
    });
    
    AnalyticsService.trackEvent(chatId, 'terms_accepted');
    
    await this.showGroupJoinStep(chatId);
  }
  
  static async showGroupJoinStep(chatId) {
    const content = `
<b>👥 Присоединитесь к нашему сообществу!</b>

Для продолжения регистрации необходимо вступить в группу сообщества Transformation Map.

<b>Что вас ждет:</b>
• Полезные материалы по саморазвитию
• Поддержка единомышленников
• Эксклюзивные вебинары и курсы
• Ответы на вопросы от экспертов

<i>⚠️ После вступления в группу нажмите "Проверить членство"</i>
    `;
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '👥 Перейти в группу', url: `https://t.me/${CONFIG.COMMUNITY_GROUP.replace('@', '')}` }],
        [{ text: '🔍 Проверить членство', callback_data: 'check_membership' }],
        [{ text: '🔙 Назад', callback_data: 'back_to_terms' }]
      ]
    };
    
    await MessageService.sendStepMessage(chatId, 2, content, { reply_markup: keyboard });
    
    UserSessionService.updateSession(chatId, {
      state: USER_STATES.GROUP_JOIN_REQUESTED
    });
    
    AnalyticsService.trackEvent(chatId, 'group_requested');
  }
  
  static async handleMembershipCheck(chatId) {
    const session = UserSessionService.getSession(chatId);
    if (!session || session.state !== USER_STATES.GROUP_JOIN_REQUESTED) {
      await TelegramAPI.sendMessage(chatId, '❌ Ошибка: неверное состояние сессии');
      return;
    }
    
    await TelegramAPI.sendMessage(chatId, '🔍 Проверяем ваше членство в группе...');
    
    // Проверяем членство в группе
    const membershipCheck = await SecurityService.checkGroupMembership(chatId);
    if (!membershipCheck.valid) {
      await this.handleSecurityError(chatId, 'not_in_group', membershipCheck);
      return;
    }
    
    UserSessionService.updateSession(chatId, {
      current_step: 3
    });
    
    // Переходим к капче
    await this.showCaptchaStep(chatId);
  }
  
  static async showCaptchaStep(chatId) {
    const session = UserSessionService.getSession(chatId);
    
    // Проверяем, заблокирован ли пользователь
    if (UserSessionService.isCaptchaBlocked(chatId)) {
      const timeLeft = UserSessionService.getCaptchaBlockTimeLeft(chatId);
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      AnalyticsService.trackEvent(chatId, 'failure', { reason: 'captcha_blocked', time_left: timeLeft });
      
      await TelegramAPI.sendMessage(chatId, 
        `🚫 <b>Блокировка капчи</b>\n\n` +
        `Вы превысили лимит попыток решения капчи.\n` +
        `Повторите попытку через ${minutes}:${seconds.toString().padStart(2, '0')}\n\n` +
        `<i>Это защита от автоматических атак.</i>`
      );
      return;
    }
    
    const captcha = CaptchaService.generateMathCaptcha();
    
    UserSessionService.updateSession(chatId, {
      state: USER_STATES.CAPTCHA_SHOWN,
      captcha_data: captcha
    });
    
    const content = `
<b>🔐 Проверка безопасности</b>

Для защиты от автоматических регистраций, пожалуйста, решите простой пример:

<b>📊 ${captcha.question}</b>

<i>Выберите правильный ответ из вариантов ниже:</i>
    `;
    
    const keyboard = {
      inline_keyboard: [
        captcha.options.map(option => ({
          text: option.toString(),
          callback_data: `captcha_${option}`
        }))
      ]
    };
    
    await MessageService.sendStepMessage(chatId, 3, content, { reply_markup: keyboard });
  }
  
  static async handleCaptchaAnswer(chatId, answer) {
    const session = UserSessionService.getSession(chatId);
    if (!session || session.state !== USER_STATES.CAPTCHA_SHOWN || !session.captcha_data) {
      await TelegramAPI.sendMessage(chatId, '❌ Ошибка: неверное состояние сессии');
      return;
    }
    
    // Проверяем, заблокирован ли пользователь
    if (UserSessionService.isCaptchaBlocked(chatId)) {
      const timeLeft = UserSessionService.getCaptchaBlockTimeLeft(chatId);
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      await TelegramAPI.sendMessage(chatId, 
        `🚫 <b>Блокировка активна</b>\n\n` +
        `Повторите попытку через ${minutes}:${seconds.toString().padStart(2, '0')}`
      );
      return;
    }
    
    const isCorrect = parseInt(answer) === session.captcha_data.answer;
    
    if (!isCorrect) {
      // Увеличиваем счетчик попыток
      const attempts = UserSessionService.incrementCaptchaAttempts(chatId);
      AnalyticsService.trackEvent(chatId, 'failure', { reason: 'captcha_failed' });
      
      let message = '';
      
      if (attempts === 1) {
        // 1-я ошибка
        message = '❌ <b>Неверный ответ!</b>\n\nПопробуйте еще раз. Будьте внимательны при решении примера.';
      } else if (attempts === 2) {
        // 2-я ошибка
        message = '❌ <b>Неверный ответ!</b>\n\n⚠️ <b>Осталась 1 попытка</b>\n\nБудьте максимально внимательны!';
      } else if (attempts >= 3) {
        // 3-я ошибка - блокировка
        UserSessionService.blockCaptcha(chatId);
        AnalyticsService.trackEvent(chatId, 'failure', { reason: 'captcha_blocked' });
        message = '🚫 <b>Блокировка на 5 минут</b>\n\nВы превысили лимит попыток решения капчи.\n\n<i>Это защита от автоматических атак.</i>';
        
        await TelegramAPI.sendMessage(chatId, message);
        return;
      }
      
      await TelegramAPI.sendMessage(chatId, message);
      
      // Показываем новую капчу
      setTimeout(() => this.showCaptchaStep(chatId), 2000);
      return;
    }
    
    // Капча пройдена успешно - сбрасываем счетчик попыток
    UserSessionService.updateSession(chatId, {
      captcha_attempts: 0,
      captcha_blocked_until: null
    });
    
    await this.completeVerification(chatId);
  }
  
  static async completeVerification(chatId) {
    const session = UserSessionService.getSession(chatId);
    const timestamp = Date.now();
    
    // Создаем зашифрованный токен
    const verificationToken = EncryptionService.createVerificationToken(chatId, timestamp);
    
    UserSessionService.updateSession(chatId, {
      state: USER_STATES.VERIFICATION_COMPLETED,
      current_step: 4,
      verification_token: verificationToken
    });
    
    // Отправляем данные на сайт
    await this.sendVerificationToWebsite(chatId, verificationToken);
    
    const content = `
<b>🎉 Верификация завершена успешно!</b>

Ваш Telegram аккаунт успешно верифицирован!

<b>✅ Выполнено:</b>
• Условия приняты
• Членство в группе подтверждено
• Проверка безопасности пройдена
• Данные отправлены на сайт

<i>🚀 Теперь вы можете завершить регистрацию на сайте</i>
    `;
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🌐 Перейти к регистрации', url: `${CONFIG.DOMAIN}/auth/telegram-verified?token=${encodeURIComponent(JSON.stringify(verificationToken))}` }]
      ]
    };
    
    await MessageService.sendStepMessage(chatId, 4, content, { reply_markup: keyboard });
    
    AnalyticsService.trackEvent(chatId, 'verification_completed', {
      completion_time: timestamp - session.started_at,
      user_info: session.user_info
    });

    // Мгновенная очистка чата после завершения (оставляем только итоговое сообщение)
    await UserSessionService.deleteAllMessagesExceptLast(chatId);
  }
  
  // Обработчики ошибок
  static async handleRateLimitError(chatId, rateLimitData) {
    AnalyticsService.trackEvent(chatId, 'failure', { reason: 'rate_limited' });
    
    await TelegramAPI.sendMessage(chatId,
      '⏱ <b>Превышен лимит запросов</b>\n\n' +
      `Попробуйте снова через ${rateLimitData.retry_after} секунд.\n\n` +
      '<i>Это защита от спама. Спасибо за понимание!</i>'
    );
  }
  
  static async handleAttemptsError(chatId, attemptsData) {
    AnalyticsService.trackEvent(chatId, 'failure', { reason: 'too_many_attempts' });
    
    await TelegramAPI.sendMessage(chatId,
      '🚫 <b>Слишком много попыток</b>\n\n' +
      `Вы превысили лимит попыток регистрации.\n` +
      `Повторите попытку через ${Math.ceil(attemptsData.retry_after / 60)} минут.\n\n` +
      '<i>Это защита от злоупотреблений.</i>'
    );
  }
  
  static async handleSecurityError(chatId, reason, checkData) {
    AnalyticsService.trackEvent(chatId, 'failure', { reason });
    
    let message = '🔒 <b>Проверка безопасности не пройдена</b>\n\n';
    
    switch (reason) {
      case 'account_too_young':
        message += `Ваш аккаунт Telegram слишком новый.\n` +
                  `Минимальный возраст: 7 дней\n` +
                  `Примерный возраст вашего аккаунта: ${checkData.estimated_age_days} дней\n\n` +
                  '<i>Попробуйте позже, когда аккаунт станет старше.</i>';
        break;
      case 'not_in_group':
        message += 'Вы не состоите в группе сообщества.\n\n' +
                  'Пожалуйста, вступите в группу и попробуйте снова.';
        break;
      default:
        message += 'Произошла ошибка при проверке. Попробуйте позже.';
    }
    
    const keyboard = reason === 'not_in_group' ? {
      inline_keyboard: [
        [{ text: '👥 Перейти в группу', url: `https://t.me/${CONFIG.COMMUNITY_GROUP.replace('@', '')}` }],
        [{ text: '🔄 Попробовать снова', callback_data: 'retry_verification' }]
      ]
    } : {};
    
    await TelegramAPI.sendMessage(chatId, message, { reply_markup: keyboard });
  }
  
  // Отправка данных на сайт
  static async sendVerificationToWebsite(telegramId, verificationToken) {
    try {
      const postData = JSON.stringify({
        telegram_id: telegramId,
        verification_token: verificationToken,
        timestamp: Date.now()
      });
      
      const options = {
        hostname: CONFIG.DOMAIN.replace('https://', ''),
        port: 443,
        path: '/api/telegram-verification',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };
      
      const req = https.request(options, (res) => {
        console.log(`📤 Verification sent to website: ${res.statusCode}`);
      });
      
      req.on('error', (error) => {
        console.error('❌ Error sending verification to website:', error);
      });
      
      req.write(postData);
      req.end();
      
    } catch (error) {
      console.error('❌ Error in sendVerificationToWebsite:', error);
    }
  }
}

// ========== ОБРАБОТЧИК CALLBACK QUERIES ==========
class CallbackHandler {
  static async handle(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    try {
      // Отвечаем на callback query
      await TelegramAPI.makeRequest('answerCallbackQuery', {
        callback_query_id: callbackQuery.id
      });
      
      // Обрабатываем различные типы callback'ов
      if (data === 'accept_terms') {
        await MessageHandlers.handleTermsAccepted(chatId);
        await UserSessionService.cleanChatAfterNewStep(chatId);
        
      } else if (data === 'check_membership') {
        await MessageHandlers.handleMembershipCheck(chatId);
        await UserSessionService.cleanChatAfterNewStep(chatId);
        
      } else if (data.startsWith('captcha_')) {
        const answer = data.replace('captcha_', '');
        await MessageHandlers.handleCaptchaAnswer(chatId, answer);
        await UserSessionService.cleanChatAfterNewStep(chatId);
        
      } else if (data === 'retry_verification') {
        const session = UserSessionService.getSession(chatId);
        if (session && session.state === USER_STATES.GROUP_JOIN_REQUESTED) {
          await MessageHandlers.handleMembershipCheck(chatId);
        }
        
      } else if (data === 'back_to_terms') {
        const session = UserSessionService.getSession(chatId);
        if (session) {
          await MessageHandlers.showTermsAndConditions(chatId, session);
        }
        
      } else if (data === 'cancel_verification') {
        await this.handleCancel(chatId);
      }
      
    } catch (error) {
      console.error('❌ Error handling callback query:', error);
      await TelegramAPI.sendMessage(chatId, 
        '❌ Произошла ошибка при обработке команды. Попробуйте снова.'
      );
    }
  }
  
  
  static async handleCancel(chatId) {
    await TelegramAPI.sendMessage(chatId,
      '❌ <b>Верификация отменена</b>\n\n' +
      'Если передумаете, используйте ссылку с сайта transformation-map.com для повторной попытки.'
    );

    // Мгновенная очистка чата при отмене (оставляем только сообщение об отмене)
    await UserSessionService.deleteAllMessagesExceptLast(chatId);
    UserSessionService.deleteSession(chatId);
  }
}

// ========== ОСНОВНОЙ ОБРАБОТЧИК СООБЩЕНИЙ ==========
class MainHandler {
  static async handleUpdate(update) {
    try {
      console.log('📨 Received update:', JSON.stringify(update, null, 2));
      
      // Обработка callback queries (нажатия кнопок)
      if (update.callback_query) {
        await CallbackHandler.handle(update.callback_query);
        return;
      }
      
      // Обработка обычных сообщений
      if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const text = message.text;
        const userInfo = message.from;
        
        // Отслеживаем сообщение пользователя для автоматического удаления
        if (message.message_id) {
          UserSessionService.addUserMessage(chatId, message.message_id);
        }
        
        // Обработка команды /start
        if (text && text.startsWith('/start')) {
          const startParam = text.split(' ')[1]; // Параметр после /start
          await MessageHandlers.handleStart(chatId, userInfo, startParam);
          
        } else if (text === '/help') {
          await this.handleHelp(chatId);
          
        } else {
          // Все прочие обращения (любые команды и обычные сообщения) 
          // перенаправляем на сайт ОДИН РАЗ для защиты от атак
          const session = UserSessionService.getSession(chatId);
          if (!session || !session.redirected_to_site) {
            await TelegramAPI.sendMessage(chatId,
              '🌐 Для работы с ботом перейдите на сайт: https://transformation-map.com'
            );
            
            // Помечаем что пользователь уже получил перенаправление
            if (!session) {
              UserSessionService.createSession(chatId, userInfo);
            }
            UserSessionService.updateSession(chatId, { redirected_to_site: true });
            
            console.log(`🔄 User ${userInfo.id} (@${userInfo.username || 'no_username'}) redirected to site - message: "${text}"`);

            // Мгновенная очистка чата для нежелательных посетителей (оставляем только сообщение с ссылкой)
            await UserSessionService.deleteAllMessagesExceptLast(chatId);
          } else {
            // Уже перенаправляли - игнорируем молча
            console.log(`🔇 Ignoring repeated message from already redirected user ${userInfo.id}: "${text}"`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error handling update:', error);
    }
  }
  
  static async handleHelp(chatId) {
    const message = `🆘 <b>Помощь / FAQ</b>

Этот бот предназначен для верификации пользователей. 
🌐 <b>Для начала работы перейдите на сайт:</b> https://transformation-map.com

🔹 <b>Как пройти верификацию?</b>
• Примите условия использования (кнопка «✅ Принять»).
• Вступите в группу @transformation_map_community.
• Пройдите проверку безопасности (возраст аккаунта ≥7 дней, капча и др.).
• После успешной проверки вы получите доступ к сайту.

🔹 <b>Почему меня не верифицируют?</b>
• Ваш аккаунт моложе 7 дней.
• Вы не вступили в группу сообщества.
• Капча не пройдена или возникла ошибка.

🔹 <b>Что делать, если бот не отвечает?</b> 
• Напишите в поддержку: @transformation_map_support`;
    
    await TelegramAPI.sendMessage(chatId, message);
  }
  
  static isAdmin(userId) {
    // Список администраторов (можно вынести в конфиг)
    const adminIds = [487571387]; // Ваш Telegram ID
    return adminIds.includes(userId);
  }
}

// ========== HTTP СЕРВЕР ДЛЯ WEBHOOK ==========
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === CONFIG.WEBHOOK_PATH) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        await MainHandler.handleUpdate(update);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok": true}');
        
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"ok": false, "error": "Invalid JSON"}');
      }
    });
    
  } else if (req.method === 'GET' && req.url === '/health') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));
    
  } else if (req.method === 'GET' && req.url === '/stats') {
    // Публичная статистика
    const stats = AnalyticsService.getStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats, null, 2));
    
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// ========== ЗАПУСК СЕРВЕРА ==========
server.listen(CONFIG.WEBHOOK_PORT, () => {
  console.log('🤖 Telegram Verification Bot initialized');
  console.log('🔐 Security features enabled: AES-256, Rate Limiting, Account Age Check');
  console.log('📊 Analytics and monitoring active');
  console.log(`🌐 Webhook server listening on port ${CONFIG.WEBHOOK_PORT}`);
  console.log(`📡 Webhook URL: ${CONFIG.DOMAIN}${CONFIG.WEBHOOK_PATH}`);
  console.log(`🏥 Health check: ${CONFIG.DOMAIN}:${CONFIG.WEBHOOK_PORT}/health`);
  console.log(`📈 Stats endpoint: ${CONFIG.DOMAIN}:${CONFIG.WEBHOOK_PORT}/stats`);
});

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});