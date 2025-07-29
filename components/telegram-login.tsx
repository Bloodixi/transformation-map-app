"use client"

import React, { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

interface TelegramLoginProps {
  botName?: string
  onAuth?: (user: any) => void
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: any) => void
    }
  }
}

export default function TelegramLogin({ 
  botName = 'transformation_map_bot',
  onAuth
}: TelegramLoginProps) {
  const t = useTranslations('Auth');
  const widgetRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Create Telegram Login Widget
    if (widgetRef.current) {
      // Clear previous widget
      widgetRef.current.innerHTML = ''
      
      // Create script element
      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-widget.js?22'
      script.setAttribute('data-telegram-login', botName)
      script.setAttribute('data-size', 'large')
      script.setAttribute('data-radius', '12')
      script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram-verify`)
      script.setAttribute('data-request-access', 'write')
      script.async = true
      
      // Define callback function
      const callbackName = `telegramLoginCallback_${Date.now()}`
      ;(window as any)[callbackName] = (user: any) => {
        console.log('Telegram auth data:', user)
        if (onAuth) {
          onAuth(user)
        }
      }
      
      script.setAttribute('data-onauth', callbackName)
      
      // Append script to widget container
      widgetRef.current.appendChild(script)
    }
  }, [botName, onAuth])

  return (
    <div className="telegram-login-widget flex flex-col items-center gap-4">
      <div ref={widgetRef} className="flex justify-center" />
      
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {t('telegramLoginDescription')}
      </p>
    </div>
  )
}