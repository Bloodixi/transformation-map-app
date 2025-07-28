import { Suspense } from 'react'
import TelegramLogin from '@/components/telegram-login'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать!
          </h2>
          <p className="text-gray-600 mb-8">
            Войдите через Telegram, чтобы начать свою трансформацию
          </p>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <Suspense fallback={<div>Загрузка...</div>}>
            <TelegramLogin />
          </Suspense>
          
          <p className="text-sm text-gray-500 text-center mt-4">
            Нажимая кнопку входа, вы соглашаетесь с использованием ваших данных Telegram
          </p>
        </div>
      </div>
    </div>
  )
}