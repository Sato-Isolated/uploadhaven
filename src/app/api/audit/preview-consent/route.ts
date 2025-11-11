import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/domains/audit/audit-service';
import { MongoAuditRepository } from '@/infrastructure/database/mongo-audit-repository';
import { getDb } from '@/infrastructure/database/mongodb';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, shareId, mimeType, fileName } = body;

    if (!fileId || !shareId) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId and shareId' },
        { status: 400 }
      );
    }

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit service with repository
    const db = await getDb();
    const auditRepository = new MongoAuditRepository(db);
    const auditService = new AuditService(auditRepository);

    // Log the preview consent action
    await auditService.log({
      action: 'file.preview',
      targetId: fileId,
      severity: 'info',
      metadata: {
        shareId,
        mimeType,
        fileName,
        userAgent: userAgent.substring(0, 500), // Limit length for storage
        timestamp: new Date().toISOString(),
        source: 'share_page',
        consentType: 'preview_explicit'
      }
    }, {
      ip: ipAddress,
      userAgent
    });

    logger.info('Preview consent logged', {
      fileId,
      shareId,
      ipAddress,
      mimeType
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Failed to log preview consent', { error });
    
    // Return success even if logging fails to not block user experience
    // but log the error for monitoring
    return NextResponse.json({ success: true });
  }
}
