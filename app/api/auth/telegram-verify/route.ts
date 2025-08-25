import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const userId = searchParams.get('user_id')
    const firstName = searchParams.get('first_name')
    const lastName = searchParams.get('last_name')
    const username = searchParams.get('username')
    const photoUrl = searchParams.get('photo_url')
    
    if (!token || !userId) {
      return NextResponse.redirect(new URL('/auth/login?error=missing_params', req.url))
    }
    
    // Create mock Telegram user data for NextAuth
    const telegramData = {
      id: userId,
      first_name: firstName || '',
      last_name: lastName || '',
      username: username || '',
      photo_url: photoUrl || '',
      auth_date: Math.floor(Date.now() / 1000).toString(),
      hash: 'mock_hash_' + token // Mock hash for demo
    }
    
    // Create HTML page with auto-submit form for NextAuth
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Авторизация через Telegram</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin: 0;
        }
        .container { 
          text-align: center; 
          background: rgba(255,255,255,0.1);
          padding: 2rem;
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        .spinner {
          border: 4px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top: 4px solid white;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🚀 Завершение авторизации...</h2>
        <div class="spinner"></div>
        <p>Перенаправляем вас в приложение...</p>
        
        <form id="authForm" action="/api/auth/callback/credentials" method="POST" style="display: none;">
          <input type="hidden" name="csrfToken" value="mock_csrf" />
          <input type="hidden" name="id" value="${telegramData.id}" />
          <input type="hidden" name="first_name" value="${telegramData.first_name}" />
          <input type="hidden" name="last_name" value="${telegramData.last_name}" />
          <input type="hidden" name="username" value="${telegramData.username}" />
          <input type="hidden" name="photo_url" value="${telegramData.photo_url}" />
          <input type="hidden" name="auth_date" value="${telegramData.auth_date}" />
          <input type="hidden" name="hash" value="${telegramData.hash}" />
        </form>
        
        <script>
          // Auto submit after 2 seconds
          setTimeout(() => {
            // For now, just redirect to protected page with user data in URL
            const params = new URLSearchParams({
              user_id: '${telegramData.id}',
              first_name: '${telegramData.first_name}',
              username: '${telegramData.username}',
              success: 'true'
            });
            window.location.href = '/protected?' + params.toString();
          }, 2000);
        </script>
      </div>
    </body>
    </html>
    `
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
    
  } catch (error) {
    console.error('Telegram verification error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=verification_failed', req.url))
  }
}