'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserData {
  id: number
  telegram_id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code: string
  photo_url?: string
  created_at: string
  last_login: string
  onboarding_completed: boolean
  is_active: boolean
  timezone: string
}

interface ProfileContentProps {
  session: any
  userData: UserData | null
}

export default function ProfileContent({ session, userData }: ProfileContentProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Показываем онбординг если пользователь новый
    if (userData && !userData.onboarding_completed) {
      setShowOnboarding(true)
    }
  }, [userData])

  const handleCompleteOnboarding = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegram_id: userData?.telegram_id })
      })

      if (response.ok) {
        setShowOnboarding(false)
        // Обновляем страницу чтобы получить обновленные данные
        window.location.reload()
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  if (showOnboarding) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎉</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Добро пожаловать в Transformation Map!
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Привет, <strong>{userData?.first_name || session.user.name}</strong>! 
              Мы рады видеть вас в нашем сообществе личностных трансформаций.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                🚀 Что вас ждет:
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Персональные цели</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Создавайте и отслеживайте свои трансформации</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Аналитика прогресса</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Визуализация ваших достижений</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Система достижений</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Получайте награды за прогресс</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Сообщество</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Поддержка единомышленников</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleCompleteOnboarding}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Настраиваем профиль...
                  </div>
                ) : (
                  '🚀 Начать трансформацию'
                )}
              </Button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Вы всегда сможете изменить настройки в профиле
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок профиля */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Личный кабинет
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Добро пожаловать обратно, {userData?.first_name || session.user.name}!
            </p>
          </div>
          
          <Button 
            onClick={handleLogout}
            variant="outline"
          >
            Выйти
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Карточка пользователя */}
          <Card className="p-6">
            <div className="text-center">
              {userData?.photo_url ? (
                <img 
                  src={userData.photo_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">
                    {(userData?.first_name || session.user.name)?.charAt(0) || '👤'}
                  </span>
                </div>
              )}
              
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {userData?.first_name || session.user.name}
                {userData?.last_name && ` ${userData.last_name}`}
              </h2>
              
              {userData?.username && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  @{userData.username}
                </p>
              )}
              
              <Badge variant="secondary">
                Участник с {formatDate(userData?.created_at || new Date().toISOString())}
              </Badge>
            </div>
          </Card>

          {/* Статистика */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              📊 Статистика
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Дней в системе:</span>
                <span className="font-medium">
                  {userData ? Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Последний вход:</span>
                <span className="font-medium">
                  {userData?.last_login ? formatDate(userData.last_login) : 'Сейчас'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Статус:</span>
                <Badge variant={userData?.is_active ? "default" : "secondary"}>
                  {userData?.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Быстрые действия */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              ⚡ Быстрые действия
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                🎯 Создать цель
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📊 Посмотреть прогресс
              </Button>
              <Button variant="outline" className="w-full justify-start">
                ⚙️ Настройки
              </Button>
            </div>
          </Card>
        </div>

        {/* Дополнительная информация */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            📋 Информация о профиле
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Telegram ID:</span>
              <span className="ml-2 font-mono">{userData?.telegram_id}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Язык:</span>
              <span className="ml-2">{userData?.language_code === 'ru' ? 'Русский' : 'English'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Часовой пояс:</span>
              <span className="ml-2">{userData?.timezone || 'Europe/Moscow'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Онбординг:</span>
              <span className="ml-2">
                {userData?.onboarding_completed ? (
                  <Badge variant="default">Завершен</Badge>
                ) : (
                  <Badge variant="secondary">Не завершен</Badge>
                )}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}