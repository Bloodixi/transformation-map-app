import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { encryptedToken } = await request.json()
    
    console.log('Debug: Received token:', JSON.stringify(encryptedToken, null, 2))
    
    if (!encryptedToken || !encryptedToken.data || !encryptedToken.iv) {
      return NextResponse.json({
        success: false,
        error: 'Missing data or iv',
        received: encryptedToken
      })
    }

    const crypto = require('crypto')
    
    // Use same key as bot
    const encryptionKey = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN!).digest()
    
    console.log('Debug: Key length:', encryptionKey.length)
    console.log('Debug: IV:', encryptedToken.iv)
    console.log('Debug: Data length:', encryptedToken.data.length)
    
    try {
      // Try to decrypt
      const iv = Buffer.from(encryptedToken.iv, 'hex')
      const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv)
      
      let decrypted = decipher.update(encryptedToken.data, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      console.log('Debug: Raw decrypted:', decrypted)
      
      const userData = JSON.parse(decrypted)
      
      return NextResponse.json({
        success: true,
        decrypted: decrypted,
        parsed: userData,
        hasFields: {
          telegram_id: !!userData.telegram_id,
          timestamp: !!userData.timestamp,
          expires_at: !!userData.expires_at
        }
      })
      
    } catch (decryptError) {
      return NextResponse.json({
        success: false,
        error: 'Decryption failed',
        details: decryptError.message
      })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Request processing failed',
      details: error.message
    })
  }
}