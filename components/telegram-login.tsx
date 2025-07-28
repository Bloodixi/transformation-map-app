"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface TelegramLoginProps {
  botName?: string
}

export default function TelegramLogin({ 
  botName = 'transformation_map_bot'
}: TelegramLoginProps) {
  const t = useTranslations('Auth');
  
  const handleTelegramLogin = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Telegram button clicked!')
    
    try {
      // Generate a unique auth token for this session
      const authToken = Math.random().toString(36).substring(2, 15)
      
      // Store auth token in localStorage for verification
      localStorage.setItem('telegram_auth_token', authToken)
      
      // Redirect to Telegram bot with auth token
      const telegramUrl = `https://t.me/${botName}?start=${authToken}`
      console.log('Opening Telegram URL:', telegramUrl)
      
      // Open Telegram
      window.open(telegramUrl, '_blank')
      
      // Show instructions to user
      setTimeout(() => {
        alert(t('telegramInstructions'))
      }, 500)
      
    } catch (error) {
      console.error('Error opening Telegram:', error)
      alert(t('telegramError'))
    }
  }

  return (
    <div className="telegram-login-widget flex flex-col items-center gap-4">
      <Button 
        onClick={handleTelegramLogin}
        type="button"
        className="bg-[#0088cc] hover:bg-[#0077bb] text-white px-8 py-4 rounded-lg flex items-center gap-3 cursor-pointer font-semibold text-lg transition-all duration-200 hover:scale-105"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        {t('telegramLogin')}
      </Button>
      
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {t('telegramLoginDescription')}
      </p>
    </div>
  )
}