import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Проверяем авторизацию
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const { telegram_id } = await request.json()
    
    if (!telegram_id) {
      return NextResponse.json(
        { success: false, error: 'Отсутствует telegram_id' },
        { status: 400 }
      )
    }

    // Проверяем что пользователь может изменять только свой профиль
    if (parseInt(session.user.id) !== parseInt(telegram_id)) {
      return NextResponse.json(
        { success: false, error: 'Нет прав на изменение этого профиля' },
        { status: 403 }
      )
    }

    // Обновляем статус онбординга в Supabase
    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .update({ 
        onboarding_completed: true,
        last_login: new Date().toISOString()
      })
      .eq('telegram_id', telegram_id)

    if (error) {
      console.error('Error updating onboarding status:', error)
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления профиля' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Онбординг завершен успешно'
    })
    
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}