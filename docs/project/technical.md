# UploadHaven - Technical Documentation

This document provides comprehensive technical information for developers working on or integrating with UploadHaven.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Database Schema](#database-schema)
- [API Integration](#api-integration)
- [Real-time Features](#real-time-features)
- [Security Implementation](#security-implementation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Architecture Overview

UploadHaven follows a modern full-stack architecture built on Next.js 15 with the App Router pattern.

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Load Balancer │    │   CDN/Storage   │
│                 │    │                 │    │                 │
│ • Web App       │◄──►│ • Rate Limiting │◄──►│ • File Storage  │
│ • Mobile App    │    │ • SSL/TLS       │    │ • Image Cache   │
│ • API Clients   │    │ • Health Checks │    │ • Thumbnails    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Background    │    │   External APIs │
│                 │    │   Workers       │    │                 │
│ • App Router    │◄──►│ • File Cleanup  │◄──►│ • VirusTotal    │
│ • API Routes    │    │ • Notifications │    │ • Email Service │
│ • SSR/SSG       │    │ • Analytics     │    │ • Auth Provider │
│ • Real-time SSE │    │ • Health Checks │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   File System   │    │   Monitoring    │
│                 │    │                 │    │                 │
│ • MongoDB       │    │ • Local Storage │    │ • Logging       │
│ • Indexes       │    │ • Upload Dir    │    │ • Metrics       │
│ • Replication   │    │ • Temp Files    │    │ • Error Tracking│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Application Flow

1. **File Upload**
   - User uploads file via drag & drop or file picker
   - Client-side validation (size, type)
   - Multipart form submission to `/api/upload`
   - Server-side validation and virus scanning
   - File storage in public/protected directories
   - Database metadata storage
   - Real-time notification to user

2. **File Sharing**
   - Generate unique short URL
   - Optional password protection
   - Expiration handling
   - Access tracking and analytics

3. **Real-time Notifications**
   - Server-Sent Events (SSE) connection
   - MongoDB change streams (future enhancement)
   - Browser push notifications (future enhancement)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS + Radix UI + ShadCN/UI
- **State Management**: TanStack Query (React Query)
- **Animations**: Motion.dev (Framer Motion successor)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Better-auth (session-based)
- **File Storage**: Local filesystem (upgradeable to cloud)
- **Security**: bcryptjs, rate limiting, CORS
- **Background Jobs**: Custom implementation (upgradeable to Bull/Agenda)

### Development Tools
- **Package Manager**: pnpm (with workspace support)
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Vitest + React Testing Library (configured)
- **Documentation**: OpenAPI/Swagger

### External Services
- **Malware Scanning**: VirusTotal API
- **Email**: SMTP (configurable provider)
- **Monitoring**: Custom implementation
- **Analytics**: Built-in analytics system

---

## Development Setup

### Prerequisites

```bash
# Required software
Node.js >= 18.0.0
pnpm >= 8.0.0
MongoDB >= 6.0.0
Git >= 2.30.0
```

### Environment Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/uploadhaven.git
   cd uploadhaven
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```

   **Required Environment Variables:**
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/uploadhaven
   
   # Authentication
   BETTER_AUTH_SECRET=your-256-bit-secret-key-here
   BETTER_AUTH_URL=http://localhost:3000
   
   # File Storage
   MAX_FILE_SIZE=104857600  # 100MB in bytes
   UPLOAD_DIR=./public/uploads
   
   # Security (Optional but recommended)
   VIRUSTOTAL_API_KEY=your-virustotal-api-key
   
   # Email (Optional)
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-password
   
   # Rate Limiting
   RATE_LIMIT_REQUESTS=100
   RATE_LIMIT_WINDOW=900000  # 15 minutes in ms
   
   # Internal API (for background jobs)
   INTERNAL_API_KEY=your-internal-api-key
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if running locally)
   mongod --dbpath ./data/db
   
   # The application will auto-create collections and indexes
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

### Development Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm dev:turbo        # Start with Turbopack (faster builds)

# Building
pnpm build            # Build for production
pnpm start            # Start production server
pnpm build:analyze    # Analyze bundle size

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm type-check       # Run TypeScript checks
pnpm format           # Format code with Prettier

# Database
pnpm db:seed          # Seed database with test data
pnpm db:migrate       # Run database migrations
pnpm db:reset         # Reset database

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Deployment
pnpm deploy:vercel    # Deploy to Vercel
pnpm deploy:docker    # Build Docker image
```

---

## Database Schema

### Collections Overview

```javascript
// Users Collection
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  emailVerified: Boolean,
  image: String,
  role: String (enum: ['user', 'admin']),
  lastActivity: Date (indexed),
  createdAt: Date,
  updatedAt: Date
}

// Files Collection
{
  _id: ObjectId,
  filename: String (unique, indexed),
  shortUrl: String (unique, indexed),
  originalName: String,
  mimeType: String,
  size: Number,
  uploadDate: Date (indexed),
  expiresAt: Date (indexed),
  downloadCount: Number (default: 0),
  ipAddress: String,
  userAgent: String,
  scanResult: {
    safe: Boolean,
    threat: String,
    scanDate: Date
  },
  isDeleted: Boolean (indexed),
  userId: String (indexed, optional),
  isAnonymous: Boolean,
  password: String (hashed, optional),
  isPasswordProtected: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// SecurityEvents Collection
{
  _id: ObjectId,
  type: String (indexed, enum: [
    'rate_limit', 'invalid_file', 'large_file', 
    'blocked_ip', 'suspicious_activity', 'file_scan',
    'malware_detected', 'file_deletion', 'bulk_delete',
    'file_upload', 'user_registration', 'file_download',
    'file_preview', 'user_login', 'user_logout',
    'user_role_changed', 'system_maintenance'
  ]),
  timestamp: Date (indexed),
  ip: String (indexed),
  details: String,
  severity: String (indexed, enum: ['low', 'medium', 'high']),
  userAgent: String,
  filename: String,
  fileSize: Number,
  fileType: String,
  userId: String (indexed, optional),
  metadata: Mixed,
  createdAt: Date,
  updatedAt: Date
}

// Notifications Collection
{
  _id: ObjectId,
  userId: String (indexed),
  type: String (indexed, enum: [
    'file_downloaded', 'file_expired_soon', 'file_shared',
    'security_alert', 'system_announcement', 'file_upload_complete',
    'malware_detected', 'bulk_action_complete'
  ]),
  title: String,
  message: String,
  isRead: Boolean (indexed, default: false),
  priority: String (indexed, enum: ['low', 'normal', 'high', 'urgent']),
  relatedFileId: String (optional),
  relatedSecurityEventId: String (optional),
  actionUrl: String (optional),
  actionLabel: String (optional),
  expiresAt: Date (indexed, optional),
  metadata: Mixed,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### Indexes

```javascript
// Critical indexes for performance
db.files.createIndex({ expiresAt: 1 })
db.files.createIndex({ uploadDate: -1 })
db.files.createIndex({ isDeleted: 1 })
db.files.createIndex({ userId: 1, uploadDate: -1 })

db.securityEvents.createIndex({ timestamp: -1 })
db.securityEvents.createIndex({ type: 1, timestamp: -1 })
db.securityEvents.createIndex({ ip: 1 })
db.securityEvents.createIndex({ severity: 1, timestamp: -1 })

db.notifications.createIndex({ userId: 1, createdAt: -1 })
db.notifications.createIndex({ isRead: 1 })
db.notifications.createIndex({ priority: 1 })
db.notifications.createIndex({ expiresAt: 1 })

db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ lastActivity: -1 })
```

---

## API Integration

### Authentication Flow

```typescript
// Sign up new user
const signUp = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response.json();
};

// Sign in user
const signIn = async (credentials: {
  email: string;
  password: string;
  remember?: boolean;
}) => {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return response.json();
};

// Check authentication status
const getSession = async () => {
  const response = await fetch('/api/auth/session');
  return response.json();
};
```

### File Operations

```typescript
// Upload file with options
const uploadFile = async (
  file: File,
  options: {
    expiration?: string;
    password?: string;
    autoGenerateKey?: boolean;
  } = {}
) => {
  const formData = new FormData();
  formData.append('file', file);
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
};

// Get user files with pagination
const getUserFiles = async (params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/user/files?${searchParams}`);
  return response.json();
};

// Delete file
const deleteFile = async (filename: string) => {
  const response = await fetch(`/api/files/${filename}`, {
    method: 'DELETE',
  });
  return response.json();
};
```

### Real-time Notifications

```typescript
// Connect to notification stream
const connectNotifications = (
  onNotification: (notification: Notification) => void,
  onError: (error: Event) => void = console.error
) => {
  const eventSource = new EventSource('/api/notifications/stream');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notification') {
        onNotification(data.data);
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = onError;

  return eventSource;
};

// Notification management
const markAsRead = async (notificationId: string) => {
  const response = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notificationId,
      action: 'markRead',
    }),
  });
  return response.json();
};

const markAllAsRead = async () => {
  const response = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'markAllRead',
    }),
  });
  return response.json();
};
```

### Security Scanning

```typescript
// Scan individual file
const scanFile = async (fileName: string) => {
  const response = await fetch('/api/security/scan/file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName }),
  });
  return response.json();
};

// Bulk security scan (admin only)
const bulkScan = async (options: {
  filenames?: string[];
  scanAll?: boolean;
} = {}) => {
  const response = await fetch('/api/security/scan/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return response.json();
};
```

---

## Real-time Features

### Server-Sent Events Implementation

UploadHaven uses Server-Sent Events (SSE) for real-time notifications. The implementation includes:

#### SSE Connection Management

```typescript
// SSE endpoint: /api/notifications/stream
export async function GET() {
  // Authenticate user
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  
  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send connection confirmation
      const encoder = new TextEncoder();
      const connectMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Notification stream connected',
        timestamp: new Date().toISOString(),
        userId
      })}\n\n`;
      
      controller.enqueue(encoder.encode(connectMessage));

      // Set up notification polling
      const pollInterval = setInterval(async () => {
        await checkForNewNotifications(controller, encoder, userId);
      }, 5000);

      // Cleanup on connection close
      return () => {
        clearInterval(pollInterval);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### Client-side SSE Handling

```typescript
// Custom hook for notifications
export function useNotifications(options: UseNotificationsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connectToNotificationStream = useCallback(() => {
    const eventSource = new EventSource('/api/notifications/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('🔔 Connected to notification stream');
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notification') {
        // Update UI with new notification
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        
        // Show toast notification
        toast(data.data.title, {
          description: data.data.message,
          action: data.data.actionUrl ? {
            label: data.data.actionLabel || 'View',
            onClick: () => window.location.href = data.data.actionUrl
          } : undefined
        });
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      // Implement reconnection logic
    };
  }, [queryClient]);

  useEffect(() => {
    connectToNotificationStream();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connectToNotificationStream]);

  return { isConnected, /* ... other state */ };
}
```

#### Navigation-aware SSE Management

```typescript
// Navigation SSE Manager component
export function NavigationSSEManager() {
  const pathname = usePathname();
  const { handleRouteChange } = useNotificationContext();

  useEffect(() => {
    // Temporarily disable SSE during navigation
    handleRouteChange();
  }, [pathname, handleRouteChange]);

  return null;
}

// Notification context provider
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [shouldEnableSSE, setShouldEnableSSE] = useState(true);

  const handleRouteChange = () => {
    setShouldEnableSSE(false);
    setTimeout(() => setShouldEnableSSE(true), 1000);
  };

  return (
    <NotificationContext.Provider value={{ shouldEnableSSE, handleRouteChange }}>
      {children}
    </NotificationContext.Provider>
  );
}
```

---

## Security Implementation

### Input Validation

```typescript
// File upload validation
const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File too large")
    .refine((file) => ALLOWED_TYPES.includes(file.type), "File type not allowed"),
  expiration: z.enum(["1h", "24h", "7d", "30d", "never"]).optional(),
  password: z.string().min(8).optional(),
});

// User input validation
const signUpSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});
```

### Rate Limiting

```typescript
// Rate limiting configuration
export const rateLimitConfigs = {
  upload: {
    requests: 10,
    window: 15 * 60 * 1000, // 15 minutes
  },
  auth: {
    requests: 5,
    window: 15 * 60 * 1000,
  },
  api: {
    requests: 100,
    window: 15 * 60 * 1000,
  },
};

// Rate limiting middleware
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    const ip = getClientIP(request);
    const key = `rate_limit:${ip}:${config.window}`;
    
    // Check current count
    const current = await redis.get(key);
    
    if (current && parseInt(current) >= config.requests) {
      return {
        success: false,
        message: 'Rate limit exceeded',
        limit: config.requests,
        remaining: 0,
        reset: new Date(Date.now() + config.window),
      };
    }
    
    // Increment counter
    await redis.incr(key);
    await redis.expire(key, config.window / 1000);
    
    return { success: true };
  };
}
```

### Malware Scanning

```typescript
// Malware scanner implementation
export class MalwareScanner {
  async scanFile(filePath: string): Promise<ScanResult> {
    // Local heuristic scan
    const localResult = await this.localScan(filePath);
    
    if (localResult.isMalicious) {
      return localResult;
    }
    
    // VirusTotal scan if configured
    if (this.isConfigured()) {
      const vtResult = await this.virusTotalScan(filePath);
      return vtResult;
    }
    
    return localResult;
  }

  private async localScan(filePath: string): Promise<ScanResult> {
    const fileBuffer = await readFile(filePath);
    const fileContent = fileBuffer.toString();
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /base64_decode/gi,
      /shell_exec/gi,
      // ... more patterns
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileContent)) {
        return {
          isMalicious: false,
          isSuspicious: true,
          source: 'local',
          scannedAt: new Date(),
          details: 'Suspicious pattern detected',
        };
      }
    }
    
    return {
      isMalicious: false,
      isSuspicious: false,
      source: 'local',
      scannedAt: new Date(),
    };
  }

  private async virusTotalScan(filePath: string): Promise<ScanResult> {
    // Implement VirusTotal API integration
    // ...
  }
}
```

### Security Events

```typescript
// Security event logging
export const saveSecurityEvent = async (eventData: {
  type: SecurityEventType;
  ip: string;
  details: string;
  severity: SecuritySeverity;
  userAgent?: string;
  filename?: string;
  userId?: string;
}) => {
  try {
    const event = new SecurityEvent(eventData);
    await event.save();
    
    // Create notification for high-severity events
    if (eventData.severity === 'high' && eventData.userId) {
      await createSecurityNotification({
        userId: eventData.userId,
        eventType: eventData.type,
        severity: eventData.severity,
        details: eventData.details,
      });
    }
  } catch (error) {
    console.error('Failed to save security event:', error);
  }
};
```

---

## Testing

> **Note**: Vitest testing framework is configured and ready for test implementation

### Planned Testing Strategy

UploadHaven implements a comprehensive testing strategy using Vitest and React Testing Library:

#### Testing Stack (Configured)
- **Unit Testing**: Vitest + React Testing Library
- **Integration Testing**: Vitest + Supertest for API testing
- **E2E Testing**: Playwright or Cypress (Future Release)
- **Performance Testing**: Vitest + custom benchmarks
- **Security Testing**: Automated vulnerability scanning

### Future Test Structure

```
src/test/
├── __mocks__/           # Mock implementations
│   ├── mongodb.ts       # Database mocks
│   ├── auth.ts          # Authentication mocks
│   └── files.ts         # File system mocks
├── fixtures/            # Test data and files
│   ├── sample-files/    # Test upload files
│   └── mock-data/       # Database fixtures
├── setup/              # Test setup and configuration
│   ├── vitest.config.ts # Vitest configuration
│   ├── test-utils.tsx   # Testing utilities
│   └── db-setup.ts      # Test database setup
├── unit/               # Unit tests
│   ├── components/     # Component tests
│   │   ├── FileUploader.test.tsx
│   │   ├── AdminDashboard.test.tsx
│   │   └── NotificationDropdown.test.tsx
│   ├── hooks/          # Hook tests
│   │   ├── useFileOperations.test.ts
│   │   ├── useNotifications.test.ts
│   │   └── useSecurityQuery.test.ts
│   ├── lib/            # Utility tests
│   │   ├── security.test.ts
│   │   ├── malware-scanner.test.ts
│   │   └── server-utils.test.ts
│   └── api/            # API unit tests
│       ├── upload.test.ts
│       ├── auth.test.ts
│       └── notifications.test.ts
├── integration/        # Integration tests
│   ├── file-upload-flow.test.ts
│   ├── authentication-flow.test.ts
│   ├── notification-system.test.ts
│   └── security-scanning.test.ts
└── e2e/                # End-to-end tests (Future Release)
    ├── user-journey.spec.ts
    ├── admin-operations.spec.ts
    └── security-scenarios.spec.ts
```

### Planned Test Examples

```typescript
// Component test example (Next Release)
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploader } from '@/components/domains/upload/FileUploader'

describe('FileUploader Component', () => {
  it('should upload file successfully', async () => {
    const user = userEvent.setup()
    const mockFile = new File(['test content'], 'test.txt', { 
      type: 'text/plain' 
    })
    
    render(<FileUploader />)
    
    const dropzone = screen.getByTestId('file-dropzone')
    await user.upload(dropzone, mockFile)
    
    await waitFor(() => {
      expect(screen.getByText('Upload successful')).toBeInTheDocument()
    })
  })

  it('should show progress during upload', async () => {
    // Test upload progress indicator
  })

  it('should handle upload errors gracefully', async () => {
    // Test error handling
  })
})

// API integration test example (Next Release)
import request from 'supertest'
import { app } from '@/app'
import { connectTestDB, cleanupTestDB } from '@/test/setup/db-setup'

describe('Upload API Endpoints', () => {
  beforeAll(async () => {
    await connectTestDB()
  })

  afterAll(async () => {
    await cleanupTestDB()
  })

  it('POST /api/upload - should upload file with metadata', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test content'), 'test.txt')
      .field('expiration', '24h')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      fileId: expect.any(String),
      shortUrl: expect.stringMatching(/^http/),
      filename: expect.stringContaining('.txt')
    })
  })

  it('POST /api/upload - should reject invalid file types', async () => {
    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('malicious'), 'test.exe')
      .expect(400)
  })
})

// Hook test example (Next Release)
import { renderHook, waitFor } from '@testing-library/react'
import { useFileOperations } from '@/hooks/useFileOperations'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useFileOperations Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  it('should delete file successfully', async () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.deleteFile).toBeDefined()
    })

    await result.current.deleteFile('test-file-id')
    
    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false)
    })
  })
})

// Security test example (Next Release)
import { scanFileForMalware } from '@/lib/server/malware-scanner'

describe('Security Scanner', () => {
  it('should detect malicious patterns', async () => {
    const maliciousContent = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')
    
    const result = await scanFileForMalware({
      buffer: maliciousContent,
      filename: 'eicar.txt',
      mimetype: 'text/plain'
    })
    
    expect(result.isMalicious).toBe(true)
    expect(result.threats).toContain('EICAR-Test-File')
  })

  it('should allow clean files', async () => {
    const cleanContent = Buffer.from('This is a clean test file')
    
    const result = await scanFileForMalware({
      buffer: cleanContent,
      filename: 'clean.txt',
      mimetype: 'text/plain'
    })
    
    expect(result.isMalicious).toBe(false)
    expect(result.threats).toHaveLength(0)
  })
})
```

### Testing Commands (Planned)

```bash
# Install testing dependencies (Next Release)
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test suite
pnpm test components
pnpm test api
pnpm test integration

# Run E2E tests (Future Release)
pnpm test:e2e
```

### Test Coverage Goals (Next Release)

- **Unit Tests**: 90%+ coverage for utilities and hooks
- **Component Tests**: 85%+ coverage for UI components
- **API Tests**: 95%+ coverage for all endpoints
- **Integration Tests**: 80%+ coverage for critical user flows

### Testing Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Database, file system, external APIs
3. **Test Real User Interactions**: Use React Testing Library patterns
4. **Performance Testing**: Include benchmarks for file operations
5. **Security Testing**: Validate input sanitization and access controls
    const fileDoc = await File.findOne({ 
      filename: uploadResponse.filename 
    });
    expect(fileDoc).toBeTruthy();
    
    // Verify notification created
    const notification = await Notification.findOne({
      userId: testUser.id,
      type: 'file_upload_complete',
    });
    expect(notification).toBeTruthy();
  });
});
```

---

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] File storage configured (local/cloud)
- [ ] Background jobs scheduled
- [ ] Monitoring and logging setup
- [ ] Error tracking configured
- [ ] Backup strategy implemented

### Deployment Options

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Environment variables (set in Vercel dashboard)
MONGODB_URI=mongodb+srv://...
BETTER_AUTH_SECRET=...
VIRUSTOTAL_API_KEY=...
```

#### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/uploadhaven
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads

  mongo:
    image: mongo:7
    restart: always
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: uploadhaven

volumes:
  mongo_data:
```

#### Manual Server

```bash
# Build application
npm run build

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js

# Nginx configuration
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Monitoring

```typescript
// Health check endpoint
export async function GET() {
  try {
    // Check database connection
    await connectDB();
    
    // Check file system
    await access('./uploads');
    
    // Check external services
    const services = {
      database: await checkDatabase(),
      storage: await checkStorage(),
      virusTotal: await checkVirusTotal(),
    };
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

---

## Contributing

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/uploadhaven.git
   cd uploadhaven
   git remote add upstream https://github.com/original/uploadhaven.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development**
   ```bash
   pnpm install
   pnpm dev
   ```

4. **Testing**
   ```bash
   pnpm test
   pnpm lint
   pnpm type-check
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Pull Request**
   - Create PR from your fork to main repository
   - Include description of changes
   - Link related issues
   - Ensure CI passes

### Code Standards

```typescript
// File naming conventions
components/       # PascalCase for components
hooks/           # camelCase with 'use' prefix
lib/             # camelCase for utilities
types/           # camelCase for type files
api/             # kebab-case for API routes

// Component structure
export interface ComponentProps {
  // Props interface
}

export function Component({ prop }: ComponentProps) {
  // Component implementation
}

// Export default for pages/layouts
export default Component;
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new notification system
fix: resolve SSE connection issues
docs: update API documentation
style: format code with prettier
refactor: simplify file upload logic
test: add unit tests for auth
chore: update dependencies
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

---

## Performance Considerations

### Optimization Strategies

1. **File Upload Optimization**
   - Chunked uploads for large files
   - Client-side compression
   - Progress tracking
   - Resume capability

2. **Database Optimization**
   - Proper indexing strategy
   - Query optimization
   - Connection pooling
   - Data archiving

3. **Caching Strategy**
   - File metadata caching
   - Thumbnail caching
   - API response caching
   - CDN integration

4. **Real-time Performance**
   - SSE connection pooling
   - Notification batching
   - Selective updates
   - Connection management

---

## Security Best Practices

1. **File Security**
   - Virus scanning
   - File type validation
   - Size limits
   - Content inspection

2. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration
   - CSRF protection

3. **Data Protection**
   - Encryption at rest
   - Secure transmission
   - Password hashing
   - PII anonymization

4. **Access Control**
   - Role-based permissions
   - Session management
   - API authentication
   - Audit logging

---

## Future Roadmap

### Planned Features

1. **Enhanced Security**
   - Advanced malware detection
   - Behavioral analysis
   - Threat intelligence integration

2. **Scalability**
   - Microservices architecture
   - Kubernetes deployment
   - Auto-scaling
   - Load balancing

3. **User Experience**
   - Mobile applications
   - Desktop clients
   - Browser extensions
   - API SDKs

4. **Advanced Features**
   - File versioning
   - Collaboration tools
   - Advanced analytics
   - AI-powered insights

---

## Support & Resources

- **Documentation**: [docs/](./docs/)
- **API Reference**: [swagger.yaml](./docs/swagger.yaml)
- **Issues**: [GitHub Issues](https://github.com/yourusername/uploadhaven/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/uploadhaven/discussions)
- **License**: [MIT](./LICENSE)

---

*This technical documentation is maintained by the UploadHaven development team. For updates and contributions, please refer to our [contributing guidelines](./CONTRIBUTING.md).*
