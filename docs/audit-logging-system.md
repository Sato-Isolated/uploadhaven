# UploadHaven Audit & Logging System

## Overview

UploadHaven features a comprehensive, security-first audit logging system that captures all critical user actions, admin operations, security events, and file operations. The system is GDPR-compliant with automatic data retention and supports encrypted sensitive data storage.

## Architecture

### Core Components

- **Audit Service** (`src/lib/audit/audit-service.ts`) - Main service for logging and querying audit events
- **Database Models** (`src/lib/database/audit-models.ts`) - MongoDB schemas with encryption support
- **API Endpoints** (`src/app/api/admin/audit/`) - REST endpoints for logs, stats, and export
- **Admin Dashboard** (`src/components/domains/admin/audit/`) - React components for viewing and managing logs
- **React Hooks** (`src/hooks/useAuditLogs.ts`) - Custom hooks for audit log operations

### Audit Categories

1. **User Actions** (`user_action`) - User logins, profile updates, settings changes
2. **Admin Actions** (`admin_action`) - User management, system configuration changes
3. **Security Events** (`security_event`) - Failed logins, suspicious activities, blocked IPs
4. **File Operations** (`file_operation`) - File uploads, downloads, deletions
5. **Auth Events** (`auth_event`) - Authentication attempts, token operations
6. **System Events** (`system_event`) - Background processes, maintenance operations
7. **Data Access** (`data_access`) - Database queries, data exports
8. **Compliance** (`compliance`) - GDPR requests, data retention actions

## Usage Examples

### Logging Events

```typescript
import { auditService } from '@/lib/audit/audit-service';

// Log a user action
await auditService.logUserAction({
  action: 'profile_update',
  description: 'User updated their profile information',
  severity: 'info',
  status: 'success',
  userId: 'user-123',
  metadata: { ip: request.ip, userAgent: request.headers['user-agent'] }
});

// Log a security event
await auditService.logSecurityEvent({
  action: 'failed_login_attempt',
  description: 'Multiple failed login attempts detected',
  severity: 'medium',
  status: 'failure',
  threatLevel: 'medium',
  blocked: false,
  metadata: { ip: request.ip, username: 'attempted-user' }
});

// Log a file operation
await auditService.logFileOperation({
  action: 'file_upload',
  description: 'User uploaded a new file',
  severity: 'info',
  status: 'success',
  fileId: 'file-abc-123',
  fileName: 'document.pdf',
  fileHash: 'sha256-hash-value',
  userId: 'user-123',
  metadata: {
    ip: request.ip,
    fileSize: 1024000,
    mimeType: 'application/pdf',
    encrypted: true,
    passwordProtected: false
  }
});
```

### Convenience Functions

For quick logging, use the convenience functions:

```typescript
import { logUserAction, logAdminAction, logSecurityEvent, logFileOperation } from '@/lib/audit/audit-service';

// Quick user action log
await logUserAction('login', 'User logged in successfully', 'user-123', { ip: '192.168.1.1' });

// Quick admin action log
await logAdminAction('delete_user', 'Admin deleted user account', 'admin-007', 'admin@example.com', { targetUserId: 'user-456' });

// Quick security event log
await logSecurityEvent('rate_limit_exceeded', 'Rate limit exceeded for IP', 'medium', true, { ip: '203.0.113.55' });

// Quick file operation log
await logFileOperation('file_download', 'File downloaded by user', 'file-123', 'document.pdf', 'sha256-hash', 'user-123', { ip: '192.168.1.1' });
```

### Querying Logs

```typescript
// Query recent logs
const recentLogs = await auditService.queryAuditLogs({
  limit: 50,
  sortBy: 'timestamp',
  sortOrder: 'desc'
});

// Filter by category and severity
const securityLogs = await auditService.queryAuditLogs({
  category: ['security_event'],
  severity: ['high', 'critical'],
  dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  limit: 100
});

// Search logs
const searchResults = await auditService.queryAuditLogs({
  search: 'failed login',
  limit: 25
});
```

### Getting Statistics

```typescript
// Get audit statistics
const stats = await auditService.getAuditStats('24h');
console.log(`Total logs: ${stats.totalLogs}`);
console.log(`Security events: ${stats.securityEvents.total}`);
console.log(`Critical events: ${stats.securityEvents.critical}`);
```

## Data Retention & Compliance

### Automatic Retention

The system automatically sets expiration dates based on the audit category:

- **User Actions**: 1 year
- **Admin Actions**: 7 years (regulatory requirement)
- **Security Events**: 7 years
- **System Events**: 3 months
- **Data Access**: 7 years (GDPR requirement)
- **File Operations**: 1 year
- **Auth Events**: 1 year
- **Compliance**: 7 years

### GDPR Compliance

- **Data Minimization**: Only necessary data is stored, sensitive fields are encrypted
- **Right to Erasure**: Soft deletion with `deletedAt` timestamps
- **Data Portability**: Export functionality for user data
- **Purpose Limitation**: Audit data used only for security and compliance

### Encrypted Fields

Sensitive data (emails, usernames, file names) are automatically encrypted when stored:

```typescript
// These fields are automatically encrypted when present in metadata:
const sensitiveFields = ['email', 'fileName', 'username', 'realName'];
```

## Admin Dashboard Features

The admin dashboard (`/admin` > "Audit Logs" tab) provides:

- **Real-time Log Viewing** with automatic refresh
- **Advanced Filtering** by category, severity, status, date range
- **Full-text Search** across actions and descriptions
- **Export Functionality** (CSV, JSON) with date range selection
- **Statistics Dashboard** with security metrics and trends
- **Log Cleanup** for retention management

## API Endpoints

- `GET /api/admin/audit/logs` - Query audit logs with filters
- `GET /api/admin/audit/stats` - Get audit statistics
- `POST /api/admin/audit/export` - Export logs to file
- `DELETE /api/admin/audit/logs` - Cleanup old logs (admin only)

## Security Considerations

1. **IP Hashing**: All IP addresses are hashed with salt before storage
2. **Sensitive Data Encryption**: Personal information is encrypted using AES-256-GCM
3. **Access Control**: Admin-only access to audit logs and sensitive data
4. **TTL Indexes**: MongoDB TTL indexes for automatic data expiration
5. **Safe Exports**: Decryption keys required for accessing sensitive fields

## Migration from Legacy System

The old `SecurityEvent` system has been fully replaced. The new audit system provides:

- ✅ **Better Security**: Encrypted sensitive data, hashed IPs
- ✅ **GDPR Compliance**: Automatic retention, soft deletion
- ✅ **Comprehensive Coverage**: All application events, not just security
- ✅ **Better Performance**: Optimized indexes, efficient queries
- ✅ **Rich UI**: Full-featured admin dashboard
- ✅ **Export/Import**: Data portability and backup functionality

## Development Guidelines

1. **Always log critical actions**: Use audit logging for any action that affects user data or system security
2. **Choose appropriate severity**: `info` for normal operations, `medium`/`high` for security events, `critical` for emergencies
3. **Include context**: Add relevant metadata (IP, user agent, file details) for better traceability
4. **Use convenience functions**: For common operations, use the shorthand functions
5. **Test audit flows**: Ensure audit logging works in your feature tests

## Support

For questions about the audit system, see:
- Code documentation in `src/lib/audit/`
- Type definitions in `src/types/audit.ts`
- Admin dashboard components in `src/components/domains/admin/audit/`
