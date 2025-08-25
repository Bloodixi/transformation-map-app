'use client'

import { useSearchParams } from "next/navigation";
import { InfoIcon } from "lucide-react";

export default function ProtectedPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');
  const firstName = searchParams.get('first_name');
  const username = searchParams.get('username');
  const success = searchParams.get('success');

  if (!success || !userId) {
    return (
      <div className="flex-1 w-full flex flex-col gap-12 items-center justify-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          <p>❌ Доступ запрещен. Пожалуйста, авторизуйтесь.</p>
          <a href="/auth/login" className="underline">Перейти к авторизации</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-8">
      <div className="w-full">
        <div className="bg-green-100 text-green-800 p-4 rounded-md flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          🎉 Добро пожаловать! Вы успешно авторизовались через Telegram
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-3xl mb-4">🚀 Личный кабинет</h2>
        
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-xl mb-4">👤 Информация о пользователе:</h3>
          <div className="space-y-2">
            <p><strong>ID:</strong> {userId}</p>
            <p><strong>Имя:</strong> {firstName}</p>
            {username && <p><strong>Username:</strong> @{username}</p>}
          </div>
        </div>
        
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="font-semibold text-xl mb-4">🗺️ Карта трансформации</h3>
          <p className="text-gray-700">
            Здесь будет ваша персональная карта трансформации с целями, прогрессом и достижениями!
          </p>
          <div className="mt-4 p-4 bg-white rounded border-2 border-dashed border-gray-300">
            <p className="text-center text-gray-500">🚧 В разработке...</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <a href="/auth/login" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            ← Назад к авторизации
          </a>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Обновить
          </button>
        </div>
      </div>
    </div>
  );
}
