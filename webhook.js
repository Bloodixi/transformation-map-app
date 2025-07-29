const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const SECRET = 'your-github-webhook-secret'; // Замени на свой секрет
const PORT = 9001;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Проверяем подпись GitHub
      const signature = req.headers['x-hub-signature-256'];
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', SECRET)
        .update(body)
        .digest('hex');

      if (signature === expectedSignature) {
        const payload = JSON.parse(body);
        
        // Проверяем что это push в main ветку
        if (payload.ref === 'refs/heads/main') {
          console.log('🚀 Received push to main branch, deploying...');
          
          // Запускаем деплой
          exec('/var/www/transformation-map/deploy.sh', (error, stdout, stderr) => {
            if (error) {
              console.error('❌ Deploy failed:', error);
              return;
            }
            console.log('✅ Deploy output:', stdout);
          });
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"status": "ok"}');
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🎣 Webhook server listening on port ${PORT}`);
});