import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Конфигурация (должна совпадать с ботом)
const CONFIG = {
  ENCRYPTION_KEY: crypto.randomBytes(32), // В продакшене используйте переменную окружения
  TOKEN_LIFETIME: 30 * 60 * 1000, // 30 минут
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8061619447:AAFQ59yepcEbGt08yx0RGqDvZLC-X6t7u4s'
}

// Система расшифровки (идентична боту)
class DecryptionService {
  static decrypt(encryptedData: { iv: string, data: string }): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', CONFIG.ENCRYPTION_KEY)
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('❌ Error decrypting data:', error)
      throw new Error('Decryption failed')
    }
  }
  
  static validateVerificationToken(encryptedToken: any): {
    valid: boolean
    telegram_id?: string
    reason?: string
    data?: any
  } {
    try {
      // Расшифровываем токен
      const decryptedPayload = this.decrypt(encryptedToken)
      const tokenData = JSON.parse(decryptedPayload)
      
      // Проверяем структуру токена
      if (!tokenData.telegram_id || !tokenData.timestamp || !tokenData.expires_at) {
        return {
          valid: false,
          reason: 'invalid_token_structure'
        }
      }
      
      // Проверяем срок действия
      const now = Date.now()
      if (now > tokenData.expires_at) {
        return {
          valid: false,
          reason: 'token_expired'
        }
      }
      
      // Проверяем возраст токена (не старше времени жизни)
      if (now - tokenData.timestamp > CONFIG.TOKEN_LIFETIME) {
        return {
          valid: false,
          reason: 'token_too_old'
        }
      }
      
      return {
        valid: true,
        telegram_id: tokenData.telegram_id.toString(),
        data: tokenData
      }
      
    } catch (error) {
      console.error('❌ Error validating token:', error)
      return {
        valid: false,
        reason: 'token_validation_failed'
      }
    }
  }
}

// Хранилище верифицированных пользователей
class VerificationStorage {
  private static verifiedUsers = new Map<string, {
    telegram_id: string
    verified_at: number
    verification_data: any
    used: boolean
  }>()
  
  static storeVerification(telegramId: string, verificationData: any): string {
    const verificationId = crypto.randomBytes(16).toString('hex')
    
    this.verifiedUsers.set(verificationId, {
      telegram_id: telegramId,
      verified_at: Date.now(),
      verification_data: verificationData,
      used: false
    })
    
    // Очистка старых записей через 1 час
    setTimeout(() => {
      this.verifiedUsers.delete(verificationId)
    }, 60 * 60 * 1000)
    
    return verificationId
  }
  
  static getVerification(verificationId: string): {
    valid: boolean
    data?: any
    reason?: string
  } {
    const verification = this.verifiedUsers.get(verificationId)
    
    if (!verification) {
      return { valid: false, reason: 'verification_not_found' }
    }
    
    if (verification.used) {
      return { valid: false, reason: 'verification_already_used' }
    }
    
    // Проверяем срок действия (1 час)
    const now = Date.now()
    if (now - verification.verified_at > 60 * 60 * 1000) {
      this.verifiedUsers.delete(verificationId)
      return { valid: false, reason: 'verification_expired' }
    }
    
    return { valid: true, data: verification }
  }
  
  static markAsUsed(verificationId: string): boolean {
    const verification = this.verifiedUsers.get(verificationId)
    if (verification) {
      verification.used = true
      return true
    }
    return false
  }
}

// API endpoint для получения верификации от бота
export async function POST(req: NextRequest) {
  try {
    console.log('📨 Received telegram verification request')
    
    const body = await req.json()
    const { telegram_id, verification_token, timestamp } = body
    
    // Валидация входных данных
    if (!telegram_id || !verification_token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'missing_required_fields',
          message: 'Telegram ID and verification token are required' 
        },
        { status: 400 }
      )
    }
    
    // Проверяем токен верификации
    const tokenValidation = DecryptionService.validateVerificationToken(verification_token)
    
    if (!tokenValidation.valid) {
      console.error(`❌ Token validation failed: ${tokenValidation.reason}`)
      return NextResponse.json(
        { 
          success: false, 
          error: tokenValidation.reason,
          message: 'Invalid or expired verification token' 
        },
        { status: 400 }
      )
    }
    
    // Проверяем соответствие Telegram ID
    if (tokenValidation.telegram_id !== telegram_id.toString()) {
      console.error('❌ Telegram ID mismatch')
      return NextResponse.json(
        { 
          success: false, 
          error: 'telegram_id_mismatch',
          message: 'Telegram ID does not match token' 
        },
        { status: 400 }
      )
    }
    
    // Сохраняем верификацию
    const verificationId = VerificationStorage.storeVerification(telegram_id, {
      telegram_id,
      verified_at: Date.now(),
      token_data: tokenValidation.data,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    })
    
    console.log(`✅ Verification stored for Telegram ID: ${telegram_id}`)
    
    // Отправляем успешный ответ боту
    return NextResponse.json({
      success: true,
      verification_id: verificationId,
      message: 'Verification received and stored successfully'
    })
    
  } catch (error) {
    console.error('❌ Error processing telegram verification:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'server_error',
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// API endpoint для проверки статуса верификации (для сайта)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const verificationId = searchParams.get('verification_id')
    const telegramId = searchParams.get('telegram_id')
    
    if (!verificationId && !telegramId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'missing_parameters',
          message: 'verification_id or telegram_id is required' 
        },
        { status: 400 }
      )
    }
    
    if (verificationId) {
      // Проверка по ID верификации
      const verification = VerificationStorage.getVerification(verificationId)
      
      return NextResponse.json({
        success: verification.valid,
        data: verification.valid ? {
          telegram_id: verification.data?.telegram_id,
          verified_at: verification.data?.verified_at,
          used: verification.data?.used
        } : null,
        error: verification.valid ? null : verification.reason
      })
    }
    
    // Если запрос по telegram_id - возвращаем общую информацию
    return NextResponse.json({
      success: true,
      message: 'Use verification_id for detailed status'
    })
    
  } catch (error) {
    console.error('❌ Error checking verification status:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'server_error',
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Экспорт сервиса для использования в других частях приложения
export { VerificationStorage, DecryptionService }