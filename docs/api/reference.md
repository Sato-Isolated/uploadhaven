# UploadHaven API Documentation

Comprehensive API documentation for UploadHaven - a modern file sharing platform.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

UploadHaven uses session-based authentication with better-auth. Most endpoints require authentication via session cookies.

### Authentication Flow

1. **Sign Up**: `POST /api/auth/signup`
2. **Sign In**: `POST /api/auth/signin`
3. **Sign Out**: `POST /api/auth/signout`

---

## 📁 File Management API

### Upload File

Upload a new file to the platform.

**Endpoint**: `POST /api/upload`

**Authentication**: Optional (authenticated uploads are tracked)

**Content-Type**: `multipart/form-data`

**Request Body**:
```typescript
{
  file: File                    // Required: File to upload
  expiration: string           // Optional: "1h" | "24h" | "7d" | "30d" | "never"
  userId?: string              // Optional: User ID (must match session)
  password?: string            // Optional: Password protection
  autoGenerateKey?: boolean    // Optional: Auto-generate secure password
}
```

**Response**:
```typescript
{
  success: boolean
  url: string                  // File access URL
  shortUrl: string            // Shareable short URL
  filename: string            // Generated filename
  originalName: string        // Original filename
  size: number               // File size in bytes
  type: string               // MIME type
  expiresAt: string          // ISO date string
  generatedKey?: string      // Auto-generated password (if requested)
  metadata: {
    id: string               // Database ID
    uploadDate: string       // ISO date string
  }
}
```

**Example**:
```bash
curl -X POST \
  -F "file=@document.pdf" \
  -F "expiration=24h" \
  -F "password=secretpass" \
  http://localhost:3000/api/upload
```

---

### Download File

Download a file using its short URL.

**Endpoint**: `GET /api/download/[shortUrl]`

**Authentication**: Not required (public access)

**Parameters**:
- `shortUrl` (path): Short URL identifier
- `verified` (query): Verification token for password-protected files

**Response**: File binary data with appropriate headers

**Headers**:
```
Content-Type: [file MIME type]
Content-Length: [file size]
Content-Disposition: attachment; filename="[original filename]"
Cache-Control: private, no-cache
```

**Example**:
```bash
curl -O http://localhost:3000/api/download/abc123
```

---

### Preview File

Preview a file without counting as a download.

**Endpoint**: `GET /api/preview-file/[shortUrl]`

**Authentication**: Not required

**Parameters**:
- `shortUrl` (path): Short URL identifier
- `password` (query): Password for protected files

**Response**: File binary data for preview

**Headers**:
```
Content-Type: [file MIME type]
Content-Disposition: inline; filename="[original filename]"
Cache-Control: public, max-age=3600
```

---

### Get File Thumbnail

Get a thumbnail for supported file types.

**Endpoint**: `GET /api/thumbnail/[shortUrl]`

**Authentication**: Not required

**Parameters**:
- `shortUrl` (path): Short URL identifier
- `password` (query): Password for protected files

**Supported File Types**:
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4 (placeholder)
- Documents: PDF (placeholder)

**Response**: WebP thumbnail image (200x200px)

---

### Get User Files

Get files uploaded by the authenticated user.

**Endpoint**: `GET /api/user/files`

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sortBy` (string): Sort field (default: "uploadDate")
- `sortOrder` (string): "asc" | "desc" (default: "desc")

**Response**:
```typescript
{
  success: boolean
  files: Array<{
    _id: string
    filename: string
    shortUrl: string
    originalName: string
    mimeType: string
    size: number
    uploadDate: string
    expiresAt: string
    downloadCount: number
    isPasswordProtected: boolean
  }>
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

---

### Delete File

Delete a file (only by owner or admin).

**Endpoint**: `DELETE /api/files/[filename]`

**Authentication**: Required

**Parameters**:
- `filename` (path): File identifier

**Response**:
```typescript
{
  success: boolean
  message: string
}
```

---

### Bulk Delete Files

Delete multiple files at once.

**Endpoint**: `POST /api/bulk-delete`

**Authentication**: Required

**Request Body**:
```typescript
{
  filenames: string[]          // Array of filenames to delete
}
```

**Response**:
```typescript
{
  success: boolean
  deleted: number              // Number of files deleted
  failed: number               // Number of failures
  errors?: string[]            // Error messages if any
}
```

---

## 🔔 Notifications API

### Get Notifications

Get notifications for the authenticated user.

**Endpoint**: `GET /api/notifications`

**Authentication**: Required

**Query Parameters**:
- `limit` (number): Max notifications to return (default: 50)
- `includeRead` (boolean): Include read notifications (default: true)
- `type` (string): Filter by notification type
- `stats` (boolean): Return only statistics (default: false)

**Response**:
```typescript
{
  success: boolean
  notifications: Array<{
    id: string
    userId: string
    type: string
    title: string
    message: string
    isRead: boolean
    priority: "low" | "normal" | "high" | "urgent"
    relatedFileId?: string
    actionUrl?: string
    actionLabel?: string
    createdAt: string
    metadata?: Record<string, any>
  }>
  count: number
}
```

**Statistics Response** (when `stats=true`):
```typescript
{
  success: boolean
  stats: {
    total: number
    unread: number
    byPriority: {
      low: number
      normal: number
      high: number
      urgent: number
    }
    byType: Record<string, number>
  }
}
```

---

### Real-time Notifications

Connect to real-time notification stream.

**Endpoint**: `GET /api/notifications/stream`

**Authentication**: Required

**Protocol**: Server-Sent Events (SSE)

**Event Types**:
- `connected`: Connection established
- `notification`: New notification received

**Example Connection**:
```javascript
const eventSource = new EventSource('/api/notifications/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'notification') {
    console.log('New notification:', data.data);
  }
};
```

---

### Update Notifications

Mark notifications as read or perform other actions.

**Endpoint**: `PATCH /api/notifications`

**Authentication**: Required

**Request Body**:
```typescript
{
  notificationId?: string      // Specific notification ID
  action: "markRead" | "markAllRead"
}
```

**Response**:
```typescript
{
  success: boolean
  message?: string
  notification?: {
    id: string
    isRead: boolean
  }
}
```

---

### Delete Notification

Delete a specific notification.

**Endpoint**: `DELETE /api/notifications`

**Authentication**: Required

**Query Parameters**:
- `id` (string): Notification ID to delete

**Response**:
```typescript
{
  success: boolean
  message: string
}
```

---

## 🔒 Security API

### Scan File

Scan a file for malware and security threats.

**Endpoint**: `POST /api/security/scan/file`

**Authentication**: Required

**Request Body**:
```typescript
{
  fileName: string             // Filename to scan
}
```

**Response**:
```typescript
{
  fileName: string
  scanResult: {
    isMalicious: boolean
    isSuspicious: boolean
    threatName?: string
    source: "local" | "virustotal"
    scannedAt: string
    details?: string
  }
  quotaStatus?: {
    remaining: number
    used: number
    limit: number
    resetTime: string
  }
  scannedAt: string
}
```

---

### Bulk Security Scan

Scan multiple files for security threats.

**Endpoint**: `POST /api/security/scan/bulk`

**Authentication**: Required (Admin only)

**Request Body**:
```typescript
{
  filenames?: string[]         // Specific files (optional)
  scanAll?: boolean           // Scan all files (default: false)
}
```

**Response**:
```typescript
{
  success: boolean
  totalFiles: number
  scannedFiles: number
  threatsFound: number
  results: Array<{
    filename: string
    result: "clean" | "malicious" | "suspicious" | "error"
    threatName?: string
    error?: string
  }>
}
```

---

### Get Security Events

Get security events and logs.

**Endpoint**: `GET /api/security`

**Authentication**: Required (Admin only)

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Filter by event type
- `severity` (string): Filter by severity
- `startDate` (string): Filter from date
- `endDate` (string): Filter to date

**Response**:
```typescript
{
  success: boolean
  events: Array<{
    _id: string
    type: string
    timestamp: string
    ip: string
    details: string
    severity: "low" | "medium" | "high"
    userAgent?: string
    filename?: string
    userId?: string
    metadata?: Record<string, any>
  }>
  pagination: PaginationData
}
```

---

### Export Security Logs

Export security logs in various formats.

**Endpoint**: `GET /api/security/export`

**Authentication**: Required (Admin only)

**Query Parameters**:
- `format` (string): "json" | "csv" (default: "json")
- `startDate` (string): Start date filter
- `endDate` (string): End date filter
- `type` (string): Event type filter

**Response**: File download with appropriate Content-Type

---

## 📊 Analytics API

### User Analytics

Get analytics data for the authenticated user.

**Endpoint**: `GET /api/analytics/user`

**Authentication**: Required

**Response**:
```typescript
{
  success: boolean
  analytics: {
    totalUploads: number
    totalDownloads: number
    totalSize: number
    storageUsed: number
    uploadTrend: Array<{
      date: string
      count: number
    }>
    downloadTrend: Array<{
      date: string
      count: number
    }>
    topFiles: Array<{
      filename: string
      originalName: string
      downloads: number
      size: number
    }>
    fileTypes: Record<string, number>
  }
}
```

---

### Admin Analytics

Get system-wide analytics (admin only).

**Endpoint**: `GET /api/analytics/admin`

**Authentication**: Required (Admin only)

**Response**:
```typescript
{
  success: boolean
  analytics: {
    totalUsers: number
    totalFiles: number
    totalDownloads: number
    totalStorage: number
    activeUsers: number
    userGrowth: Array<{
      date: string
      count: number
    }>
    uploadActivity: Array<{
      date: string
      uploads: number
      downloads: number
    }>
    storageUsage: Array<{
      date: string
      size: number
    }>
    topUsers: Array<{
      userId: string
      email: string
      uploads: number
      downloads: number
    }>
    securityEvents: {
      total: number
      bySeverity: Record<string, number>
      recent: Array<SecurityEvent>
    }
  }
}
```

---

## 👥 Admin API

### User Management

Get list of all users (admin only).

**Endpoint**: `GET /api/admin/users`

**Authentication**: Required (Admin only)

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search by email or name
- `role` (string): Filter by role
- `status` (string): Filter by status

**Response**:
```typescript
{
  success: boolean
  users: Array<{
    _id: string
    name: string
    email: string
    role: "user" | "admin"
    emailVerified: boolean
    lastActivity: string
    createdAt: string
    _count?: {
      files: number
      downloads: number
    }
  }>
  pagination: PaginationData
}
```

---

### Update User Role

Change a user's role (admin only).

**Endpoint**: `PUT /api/admin/users/[userId]/role`

**Authentication**: Required (Admin only)

**Request Body**:
```typescript
{
  role: "user" | "admin"
}
```

---

### Delete User

Delete a user account (admin only).

**Endpoint**: `DELETE /api/admin/users/[userId]/delete`

**Authentication**: Required (Admin only)

**Response**:
```typescript
{
  success: boolean
  message: string
  deletedFiles?: number
}
```

---

### System Notifications

Send system-wide notifications (admin only).

**Endpoint**: `POST /api/admin/notifications/system`

**Authentication**: Required (Admin only)

**Request Body**:
```typescript
{
  title: string
  message: string
  priority?: "low" | "normal" | "high" | "urgent"
  targetUsers?: "all" | string[]  // "all" or specific user IDs
  metadata?: Record<string, any>
}
```

**Response**:
```typescript
{
  success: boolean
  message: string
  stats: {
    totalUsers: number
    successful: number
    failed: number
  }
  notification: {
    title: string
    message: string
    priority: string
    targetUsers: string
  }
}
```

---

## 📈 Statistics API

### Get System Statistics

Get general system statistics.

**Endpoint**: `GET /api/stats`

**Authentication**: Optional (some data requires admin)

**Response**:
```typescript
{
  success: boolean
  stats: {
    totalFiles: number
    totalDownloads: number
    totalUsers: number          // Admin only
    totalStorage: number
    recentUploads: number       // Last 24h
    recentDownloads: number     // Last 24h
    averageFileSize: number
    popularFileTypes: Record<string, number>
  }
}
```

---

### Get User Statistics

Get statistics for the authenticated user.

**Endpoint**: `GET /api/user/stats`

**Authentication**: Required

**Response**:
```typescript
{
  success: boolean
  stats: {
    totalFiles: number
    totalDownloads: number
    totalSize: number
    averageFileSize: number
    uploadsThisWeek: number
    downloadsThisWeek: number
    mostDownloadedFile?: {
      filename: string
      originalName: string
      downloads: number
    }
    fileTypeBreakdown: Record<string, number>
    storageUsed: number
    storageLimit: number
  }
}
```

---

## 📋 Activity Events API

### Get Activity Events

Get activity events (uploads, downloads, etc.).

**Endpoint**: `GET /api/events`

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Filter by event type
- `userId` (string): Filter by user (admin only)

**Response**:
```typescript
{
  success: boolean
  activities: Array<{
    _id: string
    type: string
    timestamp: string
    details: string
    ip: string
    userAgent?: string
    filename?: string
    fileSize?: number
    fileType?: string
    userId?: string
  }>
  pagination: PaginationData
}
```

---

## 🧹 Maintenance API

### Cleanup Expired Files

Remove expired files from the system.

**Endpoint**: `POST /api/cleanup`

**Authentication**: Required (Admin only)

**Response**:
```typescript
{
  success: boolean
  deletedFiles: number
  freedSpace: number          // Bytes freed
  message: string
}
```

---

### Background Service Status

Get status of background services.

**Endpoint**: `GET /api/background-service`

**Authentication**: Required (Admin only)

**Response**:
```typescript
{
  success: boolean
  services: {
    cleanup: {
      status: "running" | "stopped" | "error"
      lastRun: string
      nextRun: string
    }
    notifications: {
      status: "running" | "stopped" | "error"
      activeConnections: number
    }
    security: {
      status: "running" | "stopped" | "error"
      lastScan: string
    }
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```typescript
{
  success: false
  error: string
  details?: string
}
```

### 401 Unauthorized
```typescript
{
  success: false
  error: "Unauthorized"
}
```

### 403 Forbidden
```typescript
{
  success: false
  error: "Insufficient permissions"
}
```

### 404 Not Found
```typescript
{
  success: false
  error: "Resource not found"
}
```

### 429 Too Many Requests
```typescript
{
  success: false
  error: "Rate limit exceeded"
  rateLimit: {
    limit: number
    remaining: number
    reset: string
  }
}
```

### 500 Internal Server Error
```typescript
{
  success: false
  error: "Internal server error"
}
```

---

## Rate Limiting

API endpoints are protected by rate limiting:

- **Upload**: 10 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **General API**: 100 requests per 15 minutes
- **Admin API**: 200 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-06-12T10:30:00.000Z
```

---

## WebSocket/SSE Events

### Notification Events

Real-time events sent via Server-Sent Events:

#### Connection Event
```json
{
  "type": "connected",
  "message": "Notification stream connected",
  "timestamp": "2025-06-12T10:00:00.000Z",
  "userId": "user123"
}
```

#### Notification Event
```json
{
  "type": "notification",
  "data": {
    "id": "notif123",
    "type": "file_downloaded",
    "title": "File Downloaded",
    "message": "Your file 'document.pdf' was downloaded",
    "priority": "normal",
    "createdAt": "2025-06-12T10:00:00.000Z",
    "metadata": {
      "fileName": "document.pdf",
      "downloaderIP": "192.168.1.100"
    }
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
class UploadHavenClient {
  constructor(private baseUrl: string) {}

  async uploadFile(file: File, options?: {
    expiration?: string;
    password?: string;
  }) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.expiration) {
      formData.append('expiration', options.expiration);
    }
    
    if (options?.password) {
      formData.append('password', options.password);
    }

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  async getNotifications() {
    const response = await fetch(`${this.baseUrl}/api/notifications`);
    return response.json();
  }

  connectToNotifications(onNotification: (notification: any) => void) {
    const eventSource = new EventSource(`${this.baseUrl}/api/notifications/stream`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        onNotification(data.data);
      }
    };

    return eventSource;
  }
}

// Usage
const client = new UploadHavenClient('http://localhost:3000');

// Upload file
const result = await client.uploadFile(file, {
  expiration: '24h',
  password: 'secret123'
});

// Connect to notifications
const eventSource = client.connectToNotifications((notification) => {
  console.log('New notification:', notification);
});
```

---

## Postman Collection

A Postman collection is available for testing all API endpoints:

```json
{
  "info": {
    "name": "UploadHaven API",
    "description": "Complete API collection for UploadHaven"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

Download the collection: [UploadHaven.postman_collection.json](./UploadHaven.postman_collection.json)

---

## Changelog

### v2.0.0 (Current)
- ✅ Real-time notifications via SSE
- ✅ Comprehensive security scanning
- ✅ Admin management panel
- ✅ Enhanced file management
- ✅ Analytics and statistics
- ✅ Bulk operations

### v1.0.0
- ✅ Basic file upload/download
- ✅ User authentication
- ✅ File sharing with short URLs
- ✅ Password protection
