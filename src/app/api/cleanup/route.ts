import { NextResponse } from 'next/server'
import { triggerManualCleanup } from '@/lib/startup'

export async function POST() {
  try {
    console.log('Manual cleanup triggered via API endpoint')
    
    // Use the new background service cleanup function
    const result = await triggerManualCleanup()
    
    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      totalExpired: result.totalExpired,
      errors: result.errors.length > 0 ? result.errors : undefined
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
