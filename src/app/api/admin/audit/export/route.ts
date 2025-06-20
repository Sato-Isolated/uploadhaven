/**
 * Admin Audit Export API Endpoint
 * POST /api/admin/audit/export - Export audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { auditService } from '@/lib/audit/audit-service';
import type { AuditExportOptions } from '@/types/audit';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const exportOptions: AuditExportOptions = {
      format: body.format || 'json',
      filters: body.filters || {},
      includeMetadata: body.includeMetadata !== false,
      includeEncrypted: body.includeEncrypted === true, // Admin only
      passwordProtected: body.passwordProtected === true,
      password: body.password
    };

    // Export audit logs
    const result = await auditService.exportAuditLogs(exportOptions);

    // Log admin export action
    await auditService.logAdminAction({
      action: 'export_audit_logs',
      description: `Admin ${session.user.email} exported audit logs`,
      severity: 'medium',
      status: result.success ? 'success' : 'failure',
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      metadata: {
        format: exportOptions.format,
        recordCount: result.recordCount,
        includeEncrypted: exportOptions.includeEncrypted,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Failed to export audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
