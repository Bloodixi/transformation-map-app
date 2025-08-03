import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const crypto = require('crypto')
    
    // Test encryption/decryption with same method as bot
    const testData = JSON.stringify({
      id: "12345",
      first_name: "Test",
      auth_date: Math.floor(Date.now() / 1000).toString(),
      hash: "testhash"
    })
    
    // Use same key generation as bot
    const encryptionKey = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN!).digest()
    
    // Encrypt (same as bot)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv)
    let encrypted = cipher.update(testData, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const encryptedToken = {
      iv: iv.toString('hex'),
      data: encrypted
    }
    
    // Decrypt (same as API)
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv)
    let decrypted = decipher.update(encryptedToken.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    const decryptedData = JSON.parse(decrypted)
    
    return NextResponse.json({
      success: true,
      original: testData,
      encrypted: encryptedToken.data.substring(0, 50) + '...',
      decrypted: decrypted,
      matches: testData === decrypted
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}