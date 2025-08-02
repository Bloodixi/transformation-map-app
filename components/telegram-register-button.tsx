'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

// Типы для Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openTelegramLink: (url: string) => void
      }
    }
  }
}

interface TelegramRegisterButtonProps {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export default function TelegramRegisterButton({ 
  className = '', 
  size = 'default',
  variant = 'default'
}: TelegramRegisterButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Безопасное использование локализации с fallback
  let t: any
  try {
    t = useTranslations('Auth')
  } catch (error) {
    t = (key: string) => {
      const fallbacks: { [key: string]: string } = {
        'telegramLogin': 'Войти через Telegram'
      }
      return fallbacks[key] || key
    }
  }
  
  const handleTelegramRegister = () => {
    console.log('Telegram button clicked!')
    setIsLoading(true)
    
    try {
      // Создаем уникальную ссылку на бота с параметром register
      const botLink = 'https://t.me/transformation_map_bot?start=register'
      console.log('Opening Telegram bot link:', botLink)
      
      // Проверяем, есть ли Telegram Web App API
      if (window.Telegram && window.Telegram.WebApp) {
        console.log('Using Telegram WebApp API')
        window.Telegram.WebApp.openTelegramLink(botLink)
      } else if (navigator.userAgent.includes('Telegram')) {
        // Если открыто в Telegram браузере - открываем напрямую
        console.log('Opening in Telegram browser')
        window.location.href = botLink
      } else {
        // Для обычных браузеров - открываем в новой вкладке
        console.log('Opening in new tab')
        window.open(botLink, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Error opening Telegram bot:', error)
      // Fallback - открываем в новой вкладке
      window.open('https://t.me/transformation_map_bot?start=register', '_blank', 'noopener,noreferrer')
    }
    
    // Сбрасываем состояние загрузки через небольшую задержку
    setTimeout(() => setIsLoading(false), 2000)
  }
  
  return (
    <Button
      type="button"
      onClick={handleTelegramRegister}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`
        relative overflow-hidden transition-all duration-200
        bg-gradient-to-r from-blue-500 to-blue-600 
        hover:from-blue-600 hover:to-blue-700
        text-white font-medium
        ${className}
      `}
    >
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Открываем Telegram...</span>
          </>
        ) : (
          <>
            <svg 
              className="w-5 h-5" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span>{t('telegramLogin')}</span>
          </>
        )}
      </div>
      
      {/* Анимированный фон при загрузке */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 animate-pulse"></div>
      )}
    </Button>
  )
}

// Компонент с подробным описанием процесса
export function TelegramRegisterCard({ className = '' }: { className?: string }) {
  // Безопасное использование локализации с fallback
  let t: any
  try {
    t = useTranslations('Auth')
  } catch (error) {
    t = (key: string) => {
      const fallbacks: { [key: string]: string } = {
        'telegramLogin': 'Войти через Telegram'
      }
      return fallbacks[key] || key
    }
  }
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border border-gray-200 ${className}`}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Быстрая регистрация через Telegram
        </h3>
        
        <p className="text-gray-600 mb-6">
          Пройдите верификацию в нашем боте и получите доступ к платформе
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-sm font-semibold">1</span>
          </div>
          <div>
            <p className="font-medium text-gray-800">Принятие условий</p>
            <p className="text-sm text-gray-600">Ознакомьтесь с правилами сообщества</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-sm font-semibold">2</span>
          </div>
          <div>
            <p className="font-medium text-gray-800">Вступление в группу</p>
            <p className="text-sm text-gray-600">Присоединитесь к нашему сообществу</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-sm font-semibold">3</span>
          </div>
          <div>
            <p className="font-medium text-gray-800">Проверка безопасности</p>
            <p className="text-sm text-gray-600">Пройдите простую капчу</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800">Завершение регистрации</p>
            <p className="text-sm text-gray-600">Заполните профиль на сайте</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span><strong>Безопасность:</strong> AES-256 шифрование, проверка возраста аккаунта</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>Время:</strong> Процесс займет 2-3 минуты</span>
        </div>
      </div>
      
      <TelegramRegisterButton size="lg" className="w-full" />
      
      <p className="text-xs text-gray-500 text-center mt-4">
        При нажатии откроется Telegram бот для верификации аккаунта
      </p>
    </div>
  )
}