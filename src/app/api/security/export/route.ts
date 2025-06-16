import { NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { getRecentSecurityEvents } from '@/lib/database/models';

interface SecurityEventExport {
  id: string;
  type: string;
  timestamp: string;
  ip: string;
  details: string;
  severity: string;
  userAgent?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  metadata?: Record<string, unknown>;
}

export async function GET() {
  try {
    await connectDB();

    // Get all security events for export
    const events = await getRecentSecurityEvents(1000); // Get up to 1000 events

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEvents: events.length,
      events: events.map(
        (event): SecurityEventExport => ({
          id: event._id.toString(),
          type: event.type,
          timestamp: event.timestamp.toISOString(),
          ip: event.ip,
          details: event.details,
          severity: event.severity,
          userAgent: event.userAgent,
          filename: event.filename,
          fileSize: event.fileSize,
          fileType: event.fileType,
          metadata: event.metadata,
        })
      ),
    };

    // Return as JSON file download
    const blob = JSON.stringify(exportData, null, 2);

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="security-logs-${
          new Date().toISOString().split('T')[0]
        }.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting security logs:', error);
    return NextResponse.json(
      { error: 'Failed to export security logs' },
      { status: 500 }
    );
  }
}
