import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ShortLink({ params }: Props) {
  const { id } = await params
  
  // Декодируем base64 ID
  const decodedId = Buffer.from(
    id.replace(/-/g, '+').replace(/_/g, '/'), 
    'base64'
  ).toString()
  
  // Перенаправляем на безопасную страницу с POST
  redirect(`/ru/auth/telegram-redirect?id=${decodedId}`)
}