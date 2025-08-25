import { NextRequest, NextResponse } from 'next/server'

interface TelegramAuthData {
  id: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: string
  hash: string
}

async function verifyTelegramAuth(data: TelegramAuthData): Promise<boolean> {
  const { hash, ...authData } = data
  
  // Create data-check-string
  const dataCheckArr = Object.keys(authData)
    .sort()
    .map(key => `${key}=${authData[key as keyof typeof authData]}`)
  
  const dataCheckString = dataCheckArr.join('\n')
  
  // Create secret key using Web Crypto API
  const encoder = new TextEncoder()
  const botTokenData = encoder.encode(process.env.TELEGRAM_BOT_TOKEN!)
  
  const secretKey = await crypto.subtle.digest('SHA-256', botTokenData)
  
  // Create HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(dataCheckString)
  )
  
  // Convert to hex
  const calculatedHash = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return calculatedHash === hash
}

export async function POST(req: NextRequest) {
  try {
    const data: TelegramAuthData = await req.json()
    
    // Verify the authentication data
    const isValid = await verifyTelegramAuth(data)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      )
    }
    
    // Check if auth_date is not too old (e.g., within 24 hours)
    const authDate = parseInt(data.auth_date)
    const now = Math.floor(Date.now() / 1000)
    const maxAge = 24 * 60 * 60 // 24 hours in seconds
    
    if (now - authDate > maxAge) {
      return NextResponse.json(
        { error: 'Authentication data is too old' },
        { status: 401 }
      )
    }
    
    // Return success response with user data
    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        username: data.username,
        photoUrl: data.photo_url,
      }
    })
    
  } catch (error) {
    console.error('Telegram auth verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}