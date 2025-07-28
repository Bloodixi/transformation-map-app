import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Telegram data interface
interface TelegramAuthData {
  id: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: string
  hash: string
}

// Verify Telegram Login Widget data using Web Crypto API
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

const config: NextAuthConfig = {
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: { label: "ID", type: "text" },
        first_name: { label: "First Name", type: "text" },
        last_name: { label: "Last Name", type: "text" },
        username: { label: "Username", type: "text" },
        photo_url: { label: "Photo URL", type: "text" },
        auth_date: { label: "Auth Date", type: "text" },
        hash: { label: "Hash", type: "text" },
      },
      async authorize(credentials) {
        try {
          const telegramData = credentials as unknown as TelegramAuthData
          
          // Verify the authentication data
          const isValid = await verifyTelegramAuth(telegramData)
          
          if (!isValid) {
            console.error('Invalid Telegram authentication data')
            return null
          }
          
          // Check if auth_date is not too old (e.g., within 24 hours)
          const authDate = parseInt(telegramData.auth_date)
          const now = Math.floor(Date.now() / 1000)
          const maxAge = 24 * 60 * 60 // 24 hours in seconds
          
          if (now - authDate > maxAge) {
            console.error('Telegram authentication data is too old')
            return null
          }
          
          // Return user object
          return {
            id: telegramData.id,
            name: `${telegramData.first_name || ''} ${telegramData.last_name || ''}`.trim(),
            email: `${telegramData.id}@telegram.user`, // Telegram doesn't provide email
            image: telegramData.photo_url,
            username: telegramData.username,
          }
        } catch (error) {
          console.error('Telegram authentication error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        ;(session.user as any).username = token.username
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)