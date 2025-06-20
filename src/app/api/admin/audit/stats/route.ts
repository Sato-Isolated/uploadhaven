/**
 * Admin Audit Statistics API Endpoint
 * GET /api/admin/audit/stats - Get audit statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { auditService } from '@/lib/audit/audit-service';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '24h';

    // Get audit statistics
    const stats = await auditService.getAuditStats(timeRange);

    // Log admin access to audit statistics
    await auditService.logAdminAction({
      action: 'view_audit_stats',
      description: `Admin ${session.user.email} accessed audit statistics`,
      severity: 'info',
      status: 'success',
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      metadata: {
        timeRange,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Failed to fetch audit statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit statistics' },
      { status: 500 }
    );
  }
}
