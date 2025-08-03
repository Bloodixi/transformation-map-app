import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { encryptedToken } = await request.json()
    
    console.log('🔍 Received encryptedToken:', JSON.stringify(encryptedToken, null, 2))
    
    if (!encryptedToken || !encryptedToken.data || !encryptedToken.iv) {
      console.log('❌ Invalid token format - missing data or iv')
      return NextResponse.json(
        { success: false, error: 'Отсутствует токен или неверный формат' },
        { status: 400 }
      )
    }

    // Decrypt the token using the same method as in the bot
    const crypto = require('crypto')
    
    // Use the same ENCRYPTION_KEY as in bot - derived from bot token
    const encryptionKey = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN!).digest()
    
    console.log('Encryption key length:', encryptionKey.length)
    console.log('Data to decrypt:', encryptedToken.data.substring(0, 50) + '...')
    
    // Use createDecipheriv to match bot's createCipheriv
    const iv = Buffer.from(encryptedToken.iv, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv)
    
    let decrypted = decipher.update(encryptedToken.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    console.log('✅ Decrypted successfully:', decrypted)
    
    const userData = JSON.parse(decrypted)
    
    console.log('📄 Parsed user data:', JSON.stringify(userData, null, 2))
    
    // Validate required fields (bot sends telegram_id, timestamp, expires_at)
    if (!userData.telegram_id || !userData.timestamp || !userData.expires_at) {
      console.log('❌ Missing required fields in userData:', {
        telegram_id: !!userData.telegram_id,
        timestamp: !!userData.timestamp,
        expires_at: !!userData.expires_at,
        userData
      })
      return NextResponse.json(
        { success: false, error: 'Неверная структура токена - отсутствуют обязательные поля' },
        { status: 400 }
      )
    }
    
    // Check if token has expired
    const now = Date.now()
    if (now > userData.expires_at) {
      return NextResponse.json(
        { success: false, error: 'Токен истек' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: userData
    })
    
  } catch (error) {
    console.error('Telegram verify error:', error)
    console.error('Error details:', error.message)
    return NextResponse.json(
      { success: false, error: 'Ошибка расшифровки токена: ' + error.message },
      { status: 500 }
    )
  }
}