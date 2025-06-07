import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getSecurityStats, getRecentSecurityEvents, SecurityEvent } from '@/lib/models'

interface SecurityEventDocument {
  _id: { toString(): string }
  type: string
  timestamp: Date
  ip: string
  details: string
  severity: string
  userAgent?: string
  filename?: string
  fileSize?: number
  fileType?: string
  metadata?: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const url = new URL(request.url)
    const includeEvents = url.searchParams.get('include_events') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    // Get security statistics
    const stats = await getSecurityStats()
    
    let events: SecurityEventDocument[] = []
    if (includeEvents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events = await getRecentSecurityEvents(limit) as any[]
    }

    return NextResponse.json({
      stats,
      events: events.map((event: SecurityEventDocument) => ({
        id: event._id.toString(),
        type: event.type,
        timestamp: event.timestamp.getTime(),
        ip: event.ip,
        details: event.details,
        severity: event.severity,
        userAgent: event.userAgent,
        filename: event.filename,
        fileSize: event.fileSize,
        fileType: event.fileType,
        metadata: event.metadata
      }))
    })
  } catch (error) {
    console.error('Error fetching security data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await connectDB()
    
    // Clear all security events
    await SecurityEvent.deleteMany({})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing security events:', error)
    return NextResponse.json(
      { error: 'Failed to clear security events' },
      { status: 500 }
    )
  }
}
