'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { signIn } from 'next-auth/react'

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: any) => void
    }
  }
}

export default function SignInPage() {
  const t = useTranslations('auth')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('welcome')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('signInDescription')}
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              {t('telegramLogin')}
            </p>
            
            {/* Simple clickable button */}
            <a 
              href={`https://t.me/transformation_map_bot`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg rounded-lg transition-colors cursor-pointer shadow-lg"
            >
              🚀 {t('telegramLogin')}
            </a>
          </div>
          
          <div className="text-xs text-gray-400 text-center space-y-1">
            <p>{t('secureAuth')}</p>
            <p>{t('noDataShared')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}