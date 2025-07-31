'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface VerificationData {
  telegram_id: string
  verified_at: number
  token_data?: any
}

function TelegramVerifiedContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [error, setError] = useState<string>('')
  
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const processVerification = async () => {
      try {
        const tokenParam = searchParams.get('token')
        
        if (!tokenParam) {
          setStatus('error')
          setError('Отсутствует токен верификации')
          return
        }
        
        // Парсим токен из URL
        let verificationToken
        try {
          verificationToken = JSON.parse(decodeURIComponent(tokenParam))
        } catch (e) {
          setStatus('error')
          setError('Неверный формат токена')
          return
        }
        
        // Проверяем токен через API
        const response = await fetch('/api/telegram-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegram_id: verificationToken.telegram_id || 'unknown',
            verification_token: verificationToken,
            timestamp: Date.now()
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          setStatus('success')
          setVerificationData({
            telegram_id: verificationToken.telegram_id || 'unknown',
            verified_at: Date.now(),
            token_data: verificationToken
          })
          
          // Сохраняем ID верификации для формы регистрации
          sessionStorage.setItem('telegram_verification_id', result.verification_id)
          sessionStorage.setItem('telegram_id', verificationToken.telegram_id || '')
          
        } else {
          setStatus('error')
          setError(result.message || 'Ошибка верификации')
        }
        
      } catch (error) {
        console.error('Error processing verification:', error)
        setStatus('error')
        setError('Произошла ошибка при обработке верификации')
      }
    }
    
    processVerification()
  }, [searchParams])
  
  const handleProceedToRegistration = () => {
    // Переходим к форме регистрации с сохраненными данными
    window.location.href = '/auth/register'
  }
  
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU')
  }
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Обработка верификации...
            </h2>
            <p className="text-gray-600">
              Пожалуйста, подождите
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Ошибка верификации
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🎉 Верификация успешна!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Ваш Telegram аккаунт успешно верифицирован
            </p>
            
            {verificationData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-800 mb-2">📋 Детали верификации:</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Telegram ID:</span>
                    <span className="ml-2 font-mono">{verificationData.telegram_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Время верификации:</span>
                    <span className="ml-2">{formatTimestamp(verificationData.verified_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600">Статус:</span>
                    <span className="ml-2 text-green-600 font-semibold">✅ Верифицирован</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={handleProceedToRegistration}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                🚀 Продолжить регистрацию
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                🏠 Вернуться на главную
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Данные верификации сохранены и будут использованы при регистрации
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