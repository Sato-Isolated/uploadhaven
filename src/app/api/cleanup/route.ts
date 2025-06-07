import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { File, saveSecurityEvent } from '@/lib/models'
import { unlink } from 'fs/promises'
import path from 'path'

export async function POST() {
  try {
    await connectDB()

    // Find expired files in the database
    const now = new Date()
    const expiredFiles = await File.find({
      expiresAt: { $lt: now },
      isDeleted: false
    })

    let deletedCount = 0
    const errors: string[] = []

    // Process each expired file
    for (const file of expiredFiles) {
      try {
        // Mark as deleted in database
        await File.findByIdAndUpdate(file._id, { isDeleted: true })
        
        // Try to delete physical file
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        const filePath = path.join(uploadsDir, file.filename)
        
        try {
          await unlink(filePath)
        } catch (fsError) {
          // File might already be deleted from filesystem
          console.warn(`Could not delete physical file: ${file.filename}`, fsError)
        }
        
        deletedCount++
      } catch (error) {
        errors.push(`Failed to process ${file.filename}: ${error}`)
      }
    }

    // Log cleanup activity
    await saveSecurityEvent({
      type: 'system_maintenance',
      ip: '127.0.0.1',
      details: `Cleanup completed: ${deletedCount} expired files removed`,
      severity: 'low',
      userAgent: 'System',
      metadata: {
        deletedCount,
        totalExpired: expiredFiles.length,
        errors: errors.length
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount,
      totalExpired: expiredFiles.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to trigger cleanup.' },
    { status: 405 }
  )
}
