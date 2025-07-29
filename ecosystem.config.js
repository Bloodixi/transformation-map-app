module.exports = {
  apps: [{
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
  }]
};