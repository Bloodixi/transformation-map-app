'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function TelegramRedirect() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const tokenId = searchParams.get('id')
    
    if (tokenId) {
      // Создаем форму и отправляем POST
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = '/ru/auth/telegram-verified'
      form.style.display = 'none'
      
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'tokenId'
      input.value = tokenId
      
      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Перенаправление...</p>
      </div>
    </div>
  )
}