import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileContent from './profile-content'

export default async function ProfilePage() {
  // Проверяем авторизацию
  const session = await auth()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Получаем данные пользователя из Supabase
  const supabase = await createClient()
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', parseInt(session.user.id))
    .single()

  if (error) {
    console.error('Error fetching user data:', error)
    // Перенаправляем на страницу ошибки или показываем базовый профиль
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <ProfileContent 
        session={session}
        userData={userData}
      />
    </div>
  )
}