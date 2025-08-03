import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Временное хранение токенов в памяти (в продакшене лучше использовать Redis)
const tokenStorage = new Map<string, {
  encryptedToken: any,
  expiresAt: number,
  used: boolean
}>()

// Очистка истекших токенов каждые 5 минут
setInterval(() => {
  const now = Date.now()
  for (const [id, data] of tokenStorage.entries()) {
    if (now > data.expiresAt || data.used) {
      tokenStorage.delete(id)
    }
  }
}, 5 * 60 * 1000)

export async function POST(request: Request) {
  try {
    const { encryptedToken } = await request.json()
    
    if (!encryptedToken || !encryptedToken.data || !encryptedToken.iv) {
      return NextResponse.json(
        { success: false, error: 'Отсутствует токен или неверный формат' },
        { status: 400 }
      )
    }

    // Генерируем короткий ID
    const tokenId = crypto.randomBytes(16).toString('hex')
    
    // Сохраняем токен на 30 минут
    tokenStorage.set(tokenId, {
      encryptedToken,
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 минут
      used: false
    })

    console.log(`💾 Stored token with ID: ${tokenId}`)

    return NextResponse.json({
      success: true,
      tokenId
    })
    
  } catch (error) {
    console.error('Error storing token:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения токена' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tokenId = url.searchParams.get('id')
    
    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: 'Отсутствует ID токена' },
        { status: 400 }
      )
    }

    const tokenData = tokenStorage.get(tokenId)
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Токен не найден или истек' },
        { status: 404 }
      )
    }

    if (tokenData.used) {
      return NextResponse.json(
        { success: false, error: 'Токен уже использован' },
        { status: 400 }
      )
    }

    if (Date.now() > tokenData.expiresAt) {
      tokenStorage.delete(tokenId)
      return NextResponse.json(
        { success: false, error: 'Токен истек' },
        { status: 400 }
      )
    }

    // Помечаем токен как использованный
    tokenData.used = true

    console.log(`📤 Retrieved token with ID: ${tokenId}`)

    return NextResponse.json({
      success: true,
      encryptedToken: tokenData.encryptedToken
    })
    
  } catch (error) {
    console.error('Error retrieving token:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка получения токена' },
      { status: 500 }
    )
  }
}