'use client'

import { useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramLoginWidgetProps {
  botName: string
  onAuth?: (user: TelegramUser) => void
}

export default function TelegramLoginWidget({ 
  botName, 
  onAuth 
}: TelegramLoginWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Создаем глобальную функцию для callback
    ;(window as any).onTelegramAuth = async (user: TelegramUser) => {
      console.log('🔗 Telegram auth successful:', user)
      
      try {
        // Автоматически логинимся через NextAuth
        const result = await signIn('telegram', {
          id: user.id.toString(),
          first_name: user.first_name,
          last_name: user.last_name || '',
          username: user.username || '',
          photo_url: user.photo_url || '',
          auth_date: user.auth_date.toString(),
          hash: user.hash,
          redirect: false
        })
        
        if (result?.ok) {
          console.log('✅ NextAuth login successful')
          
          // Перенаправляем в профиль
          window.location.href = '/profile'
        } else {
          console.error('❌ NextAuth login failed:', result?.error)
        }
        
        // Вызываем пользовательский callback если есть
        if (onAuth) {
          onAuth(user)
        }
      } catch (error) {
        console.error('❌ Error during auth:', error)
      }
    }

    // Создаем скрипт для Telegram Widget
    if (ref.current) {
      // Очищаем контейнер
      ref.current.innerHTML = ''
      
      // Создаем скрипт
      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-widget.js?8'
      script.setAttribute('data-telegram-login', botName)
      script.setAttribute('data-size', 'large')
      script.setAttribute('data-onauth', 'onTelegramAuth(user)')
      script.setAttribute('data-request-access', 'write')
      script.async = true
      
      ref.current.appendChild(script)
    }

    // Cleanup
    return () => {
      if ((window as any).onTelegramAuth) {
        delete (window as any).onTelegramAuth
      }
    }
  }, [botName, onAuth])

  return (
    <div className="telegram-login-widget">
      <div ref={ref} />
      <p className="text-sm text-gray-600 mt-2">
        👆 Нажмите кнопку выше для входа через Telegram
      </p>
    </div>
  )
}