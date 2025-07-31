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
  COMMUNITY_GROUP_ID: '-1001234567890', // Замените на реальный ID
  
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
      
      return await this.makeRequest('sendMessage', {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
      });
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
      last_activity: Date.now()
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
    
    const isCorrect = parseInt(answer) === session.captcha_data.answer;
    
    if (!isCorrect) {
      AttemptsService.incrementAttempts(chatId);
      AnalyticsService.trackEvent(chatId, 'failure', { reason: 'captcha_failed' });
      
      await TelegramAPI.sendMessage(chatId, 
        '❌ <b>Неверный ответ!</b>\n\n' +
        'Попробуйте еще раз. Будьте внимательны при решении примера.'
      );
      
      // Показываем новую капчу
      setTimeout(() => this.showCaptchaStep(chatId), 2000);
      return;
    }
    
    // Капча пройдена успешно
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
        [{ text: '🌐 Перейти к регистрации', url: `${CONFIG.DOMAIN}/auth/telegram-verified?token=${encodeURIComponent(JSON.stringify(verificationToken))}` }],
        [{ text: '📊 Статистика', callback_data: 'show_stats' }]
      ]
    };
    
    await MessageService.sendStepMessage(chatId, 4, content, { reply_markup: keyboard });
    
    AnalyticsService.trackEvent(chatId, 'verification_completed', {
      completion_time: timestamp - session.started_at,
      user_info: session.user_info
    });
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
        
      } else if (data === 'check_membership') {
        await MessageHandlers.handleMembershipCheck(chatId);
        
      } else if (data.startsWith('captcha_')) {
        const answer = data.replace('captcha_', '');
        await MessageHandlers.handleCaptchaAnswer(chatId, answer);
        
      } else if (data === 'show_stats') {
        await this.showStats(chatId);
        
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
  
  static async showStats(chatId) {
    const stats = AnalyticsService.getStats();
    
    const message = `
📊 <b>Статистика верификации</b>

<b>📈 Общая статистика:</b>
• Всего начали: ${stats.overview.total_started}
• Завершили: ${stats.overview.completed}
• Успешность: ${stats.overview.completion_rate}

<b>🔢 По этапам:</b>
• 1️⃣ Показ условий: ${stats.stages['1_terms_shown']}
• 2️⃣ Принятие условий: ${stats.stages['2_terms_accepted']} (${stats.conversion_rates.terms_accepted}%)
• 3️⃣ Запрос группы: ${stats.stages['3_group_requested']} (${stats.conversion_rates.group_requested}%)
• 4️⃣ Завершение: ${stats.stages['4_completed']} (${stats.conversion_rates.completed}%)

<b>❌ Неудачи:</b>
• Rate limit: ${stats.failures.rate_limited}
• Молодой аккаунт: ${stats.failures.account_too_young}
• Не в группе: ${stats.failures.not_in_group}
• Капча: ${stats.failures.captcha_failed}
• Много попыток: ${stats.failures.too_many_attempts}
    `.trim();
    
    await TelegramAPI.sendMessage(chatId, message);
  }
  
  static async handleCancel(chatId) {
    UserSessionService.deleteSession(chatId);
    
    await TelegramAPI.sendMessage(chatId,
      '❌ <b>Верификация отменена</b>\n\n' +
      'Если передумаете, используйте ссылку с сайта transformation-map.com для повторной попытки.'
    );
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
        
        // Обработка команды /start
        if (text && text.startsWith('/start')) {
          const startParam = text.split(' ')[1]; // Параметр после /start
          await MessageHandlers.handleStart(chatId, userInfo, startParam);
          
        } else if (text === '/stats' && this.isAdmin(userInfo.id)) {
          // Административная команда для статистики
          await CallbackHandler.showStats(chatId);
          
        } else if (text === '/help') {
          await this.handleHelp(chatId);
          
        } else {
          // Неизвестная команда
          await TelegramAPI.sendMessage(chatId,
            '❓ <b>Неизвестная команда</b>\n\n' +
            'Для регистрации используйте ссылку с сайта transformation-map.com\n\n' +
            'Доступные команды:\n' +
            '• /help - справка'
          );
        }
      }
      
    } catch (error) {
      console.error('❌ Error handling update:', error);
    }
  }
  
  static async handleHelp(chatId) {
    const message = `🤖 <b>Telegram Verification Bot</b>\n\nЭтот бот предназначен для верификации пользователей перед регистрацией на сайте transformation-map.com\n\n<b>🔐 Процесс верификации:</b>\n1️⃣ Принятие условий\n2️⃣ Вступление в группу сообщества\n3️⃣ Проверка безопасности\n4️⃣ Завершение и переход на сайт\n\n<b>📋 Требования:</b>\n• Возраст аккаунта: минимум 7 дней\n• Членство в группе @transformation_map_community\n• Прохождение капчи\n\n<b>🌐 Для начала:</b>\nИспользуйте ссылку с сайта transformation-map.com`;
    
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