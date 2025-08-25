import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🎉 Добро пожаловать в личный кабинет!
          </h1>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Информация о пользователе:
            </h2>
            <div className="space-y-2">
              <p><strong>Имя:</strong> {session.user.name}</p>
              <p><strong>ID:</strong> {session.user.id}</p>
              {(session.user as any).username && (
                <p><strong>Username:</strong> @{(session.user as any).username}</p>
              )}
              {session.user.image && (
                <div className="mt-4">
                  <strong>Фото:</strong>
                  <img 
                    src={session.user.image} 
                    alt="User avatar" 
                    className="w-16 h-16 rounded-full mt-2"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              🚧 В разработке
            </h3>
            <p className="text-yellow-800">
              Здесь будет ваша персональная карта трансформации!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}