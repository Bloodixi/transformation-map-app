import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { createClient } from "@supabase/supabase-js"

// Telegram data interface for bot verification
interface TelegramBotData {
  telegram_id: number
  timestamp: number
  expires_at: number
}

// Legacy Telegram Login Widget data interface
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

// Create Supabase client for NextAuth adapter
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const config: NextAuthConfig = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        // Bot verification data
        telegram_id: { label: "Telegram ID", type: "text" },
        timestamp: { label: "Timestamp", type: "text" },
        expires_at: { label: "Expires At", type: "text" },
        // Legacy widget data (for backward compatibility)
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
          console.log('🔍 Telegram auth credentials:', credentials)
          
          // Check if this is bot verification data or legacy widget data
          const isBotData = credentials?.telegram_id && credentials?.timestamp && credentials?.expires_at
          
          if (isBotData) {
            // Handle bot verification data
            const botData = credentials as unknown as TelegramBotData
            
            console.log('🤖 Processing bot verification data:', botData)
            
            // Check if token is still valid
            const now = Date.now()
            if (now > botData.expires_at) {
              console.error('❌ Bot token has expired')
              return null
            }
            
            // Check if user exists in Supabase, if not create them
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('telegram_id', botData.telegram_id)
              .single()

            let user = existingUser

            if (!existingUser && !fetchError) {
              // Create new user with bot data
              const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                  telegram_id: botData.telegram_id,
                  first_name: 'Telegram User', // Bot doesn't provide name
                  language_code: 'ru',
                  onboarding_completed: false
                })
                .select()
                .single()

              if (createError) {
                console.error('❌ Error creating user:', createError)
                return null
              }
              user = newUser
              console.log('✅ Created new user from bot data:', user)
            } else if (fetchError && fetchError.code !== 'PGRST116') {
              console.error('❌ Error fetching user:', fetchError)
              return null
            }

            if (user) {
              // Update last_login
              await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('telegram_id', botData.telegram_id)
              
              console.log('✅ Updated last login for user:', botData.telegram_id)
            }
            
            // Return user object for NextAuth
            return {
              id: botData.telegram_id.toString(),
              name: user?.first_name || 'Telegram User',
              email: `${botData.telegram_id}@telegram.user`,
              image: user?.photo_url || null,
              username: user?.username || null,
            }
            
          } else {
            // Handle legacy widget data
            const telegramData = credentials as unknown as TelegramAuthData
            
            console.log('🔗 Processing legacy widget data:', telegramData)
            
            // Verify the authentication data
            const isValid = await verifyTelegramAuth(telegramData)
            
            if (!isValid) {
              console.error('❌ Invalid Telegram authentication data')
              return null
            }
            
            // Check if auth_date is not too old (e.g., within 24 hours)
            const authDate = parseInt(telegramData.auth_date)
            const now = Math.floor(Date.now() / 1000)
            const maxAge = 24 * 60 * 60 // 24 hours in seconds
            
            if (now - authDate > maxAge) {
              console.error('❌ Telegram authentication data is too old')
              return null
            }

            // Check if user exists in Supabase, if not create them
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('telegram_id', parseInt(telegramData.id))
              .single()

            let user = existingUser

            if (!existingUser && !fetchError) {
              // Create new user
              const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                  telegram_id: parseInt(telegramData.id),
                  first_name: telegramData.first_name,
                  last_name: telegramData.last_name,
                  username: telegramData.username,
                  photo_url: telegramData.photo_url,
                  language_code: 'ru', // Default to Russian
                  onboarding_completed: false
                })
                .select()
                .single()

              if (createError) {
                console.error('❌ Error creating user:', createError)
                return null
              }
              user = newUser
            } else if (fetchError && fetchError.code !== 'PGRST116') {
              console.error('❌ Error fetching user:', fetchError)
              return null
            }

            if (user) {
              // Update last_login
              await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('telegram_id', parseInt(telegramData.id))
            }
            
            // Return user object for NextAuth
            return {
              id: telegramData.id,
              name: `${telegramData.first_name || ''} ${telegramData.last_name || ''}`.trim(),
              email: `${telegramData.id}@telegram.user`, // Telegram doesn't provide email
              image: telegramData.photo_url,
              username: telegramData.username,
            }
          }
        } catch (error) {
          console.error('❌ Telegram authentication error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, user }) {
      if (user && session.user) {
        // Get additional user data from Supabase
        const { data: userData } = await supabase
          .from('users')
          .select('telegram_id, username, language_code, onboarding_completed, photo_url')
          .eq('telegram_id', parseInt(user.id))
          .single()

        if (userData) {
          session.user.id = user.id
          ;(session.user as any).telegram_id = userData.telegram_id
          ;(session.user as any).username = userData.username
          ;(session.user as any).language_code = userData.language_code
          ;(session.user as any).onboarding_completed = userData.onboarding_completed
          if (userData.photo_url) {
            session.user.image = userData.photo_url
          }
        }
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)