import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { saveSecurityEvent } from '@/lib/models';
import { getClientIP } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get the real client IP
    const clientIP = getClientIP(request);

    // Create some test security events
    const testEvents = [
      {
        type: 'rate_limit',
        ip: clientIP,
        details: 'Rate limit exceeded for file upload',
        severity: 'medium',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        filename: 'test-file.pdf',
        fileSize: 1024000,
        fileType: 'application/pdf',
      },
      {
        type: 'invalid_file',
        ip: clientIP,
        details: 'Attempted to upload suspicious file type',
        severity: 'high',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        filename: 'malicious.exe',
        fileSize: 2048000,
        fileType: 'application/octet-stream',
      },
      {
        type: 'large_file',
        ip: clientIP,
        details: 'File size exceeds maximum limit',
        severity: 'low',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        filename: 'large-video.mp4',
        fileSize: 100000000,
        fileType: 'video/mp4',
      },
      {
        type: 'malware_detected',
        ip: clientIP,
        details: 'Malware signature detected in uploaded file',
        severity: 'critical',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        filename: 'virus.zip',
        fileSize: 512000,
        fileType: 'application/zip',
      },
    ];

    // Save each test event
    for (const eventData of testEvents) {
      await saveSecurityEvent(eventData);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${testEvents.length} test security events`,
    });
  } catch (error) {
    console.error('Error creating test events:', error);
    return NextResponse.json(
      { error: 'Failed to create test events' },
      { status: 500 }
    );
  }
}
