module.exports = {
  apps: [
    {
      name: 'transformation-map',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/transformation-map',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Логи
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'telegram-verification-bot',
      script: './telegram-verification-bot.js',
      cwd: '/var/www/transformation-map',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        TELEGRAM_BOT_TOKEN: '8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s'
      },
      env_production: {
        NODE_ENV: 'production',
        TELEGRAM_BOT_TOKEN: '8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s'
      },
      // Логи для бота
      out_file: './logs/telegram-verification-bot-out.log',
      error_file: './logs/telegram-verification-bot-error.log',
      log_file: './logs/telegram-verification-bot-combined.log',
      time: true
    }
  ]
};