'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AES, enc } from 'crypto-js'
import { Button } from '@/components/ui/button'

interface TelegramUserData {
  id: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: string
  hash: string
}

function TelegramVerifiedContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [userData, setUserData] = useState<TelegramUserData | null>(null)
  const [error, setError] = useState<string>('')
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  useEffect(() => {
    const processVerification = async () => {
      try {
        // Проверяем параметры URL и куки
        const tokenId = searchParams.get('id')
        const tokenParam = searchParams.get('token')
        
        // Пытаемся получить токен из куки (более безопасно)
        let cookieTokenId: string | null = null
        try {
          const cookies = document.cookie.split(';')
          const telegramCookie = cookies.find(c => c.trim().startsWith('telegram_token_id='))
          if (telegramCookie) {
            cookieTokenId = telegramCookie.split('=')[1]
            // Удаляем куки после использования
            document.cookie = 'telegram_token_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          }
        } catch (e) {
          console.log('No cookie found')
        }
        
        const finalTokenId = cookieTokenId || tokenId
        
        if (!finalTokenId && !tokenParam) {
          setStatus('error')
          setError('Отсутствует токен верификации')
          return
        }
        
        let encryptedData
        
        if (tokenId) {
          // Новый способ: получаем токен по ID с сервера
          try {
            const response = await fetch(`/api/store-token?id=${tokenId}`)
            const result = await response.json()
            
            if (!result.success) {
              setStatus('error')
              setError(result.error || 'Токен не найден или истек')
              return
            }
            
            encryptedData = result.encryptedToken
          } catch (e) {
            setStatus('error')
            setError('Ошибка при получении токена с сервера')
            return
          }
        } else {
          // Старый способ: парсим токен из URL (для совместимости)
          try {
            encryptedData = JSON.parse(decodeURIComponent(tokenParam!))
          } catch (e) {
            setStatus('error')
            setError('Неверный формат токена')
            return
          }
        }
        
        // Отправляем зашифрованный токен на сервер для расшифровки
        let decryptedData
        try {
          const response = await fetch('/api/telegram-verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ encryptedToken: encryptedData })
          })
          
          const result = await response.json()
          
          if (!result.success) {
            setStatus('error')
            setError(result.error || 'Ошибка расшифровки токена')
            return
          }
          
          decryptedData = result.data
        } catch (e) {
          setStatus('error')
          setError('Ошибка при обращении к серверу')
          return
        }
        
        // Проверяем время жизни токена
        const now = Date.now()
        const tokenAge = now - decryptedData.timestamp
        const maxAge = 30 * 60 * 1000 // 30 минут
        
        if (tokenAge > maxAge || now > decryptedData.expires_at) {
          setStatus('expired')
          setError('Токен истек. Пройдите верификацию заново')
          return
        }
        
        // Преобразуем данные в формат для отображения
        const displayData = {
          id: decryptedData.telegram_id.toString(),
          first_name: 'Telegram User', // Базовое имя, так как бот не передает имя
          auth_date: Math.floor(decryptedData.timestamp / 1000).toString()
        }
        
        setUserData(displayData)
        
        // Автоматически входим через NextAuth с telegram_id
        const result = await signIn('telegram', {
          telegram_id: decryptedData.telegram_id,
          timestamp: decryptedData.timestamp,
          expires_at: decryptedData.expires_at,
          redirect: false
        })
        
        if (result?.ok) {
          setStatus('success')
          // Перенаправляем в профиль через 2 секунды
          setTimeout(() => {
            router.push('/profile')
          }, 2000)
        } else {
          setStatus('error')
          setError('Ошибка авторизации: ' + (result?.error || 'Неизвестная ошибка'))
        }
        
      } catch (error) {
        console.error('Error processing verification:', error)
        setStatus('error')
        setError('Произошла ошибка при обработке верификации')
      }
    }
    
    processVerification()
  }, [searchParams, router])
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString('ru-RU')
  }
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              🔐 Завершение авторизации...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Расшифровываем токен и создаем сессию
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (status === 'error' || status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {status === 'expired' ? 'Токен истек' : 'Ошибка авторизации'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                🔄 Попробовать снова
              </Button>
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                🏠 Вернуться на главную
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              🎉 Авторизация успешна!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Добро пожаловать! Переносим вас в личный кабинет...
            </p>
            
            {userData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">👤 Ваши данные:</h3>
                <div className="space-y-2 text-sm">
                  {userData.first_name && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Имя:</span>
                      <span className="ml-2 font-medium">{userData.first_name} {userData.last_name || ''}</span>
                    </div>
                  )}
                  {userData.username && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Username:</span>
                      <span className="ml-2 font-mono">@{userData.username}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Авторизован:</span>
                    <span className="ml-2">{formatTimestamp(userData.auth_date)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-400">Статус:</span>
                    <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">✅ Авторизован</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center justify-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">Переход в профиль...</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Сессия создана. Следующий вход будет автоматическим.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return null
}

export default function TelegramVerifiedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Загрузка...
            </h2>
            <p className="text-gray-600">
              Пожалуйста, подождите
            </p>
          </div>
        </div>
      </div>
    }>
      <TelegramVerifiedContent />
    </Suspense>
  )
}