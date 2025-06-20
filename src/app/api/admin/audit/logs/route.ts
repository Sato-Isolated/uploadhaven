/**
 * Admin Audit Logs API Endpoint
 * GET /api/admin/audit/logs - Get audit logs with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { auditService } from '@/lib/audit/audit-service';
import type { AuditLogFilters } from '@/types/audit';

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
    }    // Parse query parameters
    const url = new URL(request.url);
    const filters: any = {
      category: url.searchParams.get('category') || undefined,
      severity: url.searchParams.get('severity') || undefined,
      status: url.searchParams.get('status') || undefined,
      userId: url.searchParams.get('userId') || undefined,
      adminId: url.searchParams.get('adminId') || undefined,
      action: url.searchParams.get('action') || undefined,
      search: url.searchParams.get('search') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
      sortBy: url.searchParams.get('sortBy') || 'timestamp',
      sortOrder: url.searchParams.get('sortOrder') || 'desc',
    };

    // Handle date filters
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    // Handle array filters
    const categories = url.searchParams.get('categories');
    if (categories) {
      filters.category = categories.split(',');
    }

    const severities = url.searchParams.get('severities');
    if (severities) {
      filters.severity = severities.split(',');
    }

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
        delete filters[key];
      }
    });

    // Query audit logs
    const result = await auditService.queryAuditLogs(filters as AuditLogFilters);

    // Log admin access to audit logs
    await auditService.logAdminAction({
      action: 'view_audit_logs',
      description: `Admin ${session.user.email} accessed audit logs`,
      severity: 'info',
      status: 'success',
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      metadata: {
        filters: JSON.stringify(filters),
        resultCount: result.logs.length,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/audit/logs
 * Delete old audit logs (cleanup)
 */
export async function DELETE(request: NextRequest) {
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
    const daysOld = parseInt(url.searchParams.get('daysOld') || '365');

    // Validate parameters
    if (daysOld < 1 || daysOld > 2555) {
      return NextResponse.json(
        { error: 'daysOld must be between 1 and 2555' },
        { status: 400 }
      );
    }

    // Perform cleanup
    const result = await auditService.cleanupOldLogs(daysOld);

    // Log the admin action
    await auditService.logAdminAction({
      action: 'audit_logs_cleanup',
      description: `Admin cleaned up audit logs older than ${daysOld} days`,
      severity: 'medium',
      status: 'success',
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      metadata: {
        daysOld,
        deletedCount: result.deletedCount,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully deleted ${result.deletedCount} old audit logs`,
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup audit logs' },
      { status: 500 }
    );
  }
}
