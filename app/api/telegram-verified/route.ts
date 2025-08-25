import { NextResponse, NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const tokenId = formData.get('tokenId') as string
    
    if (!tokenId) {
      return NextResponse.redirect(new URL('/ru/auth/login?error=missing_token', request.url))
    }
    
    // Перенаправляем на страницу с токеном в куки
    const response = NextResponse.redirect(new URL('/ru/auth/telegram-verified', request.url))
    
    // Сохраняем tokenId в куки для безопасной передачи
    response.cookies.set('telegram_token_id', tokenId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 300 // 5 минут
    })
    
    return response
    
  } catch (error) {
    console.error('Error processing POST:', error)
    return NextResponse.redirect(new URL('/ru/auth/login?error=invalid_request', request.url))
  }
}