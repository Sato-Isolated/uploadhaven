# Library Documentation

The `lib/` directory contains core services, utilities, and configuration that power UploadHaven's
functionality.

## 📁 Library Structure

```
lib/
├── api/                    # API client and utilities
├── notifications/          # Real-time notification system
├── query/                  # TanStack Query configuration
├── server/                 # Server-side utilities
├── auth.ts                 # Better Auth configuration
├── auth-client.ts          # Client-side auth utilities
├── background-cleanup.ts   # Background file cleanup
├── constants.ts            # Application constants
├── models.ts               # MongoDB models and schemas
├── mongodb.ts              # Database connection
├── prefetch.ts             # Data prefetching utilities
├── queryKeys.ts            # Query key management
├── rateLimit.ts            # Rate limiting implementation
├── security.ts             # Security scanning and validation
├── server-utils.ts         # Server-side utilities
├── startup.ts              # Application startup logic
└── utils.ts                # Common utility functions
```

## 🔧 Core Services

### 🔐 Authentication (`auth.ts` & `auth-client.ts`)

**Better Auth Configuration**

```typescript
// auth.ts - Server configuration
export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: { enabled: true },
  session: { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
  secret: process.env.BETTER_AUTH_SECRET,
});

// auth-client.ts - Client utilities
export const { useSession, signIn, signOut } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
});
```

**Features:**

- Email/password authentication
- Session management
- MongoDB integration
- Client-side hooks

### 🗄️ Database (`mongodb.ts` & `models.ts`)

**Connection Management**

```typescript
// mongodb.ts - Connection with caching
let cached = global.mongoose;

async function connectDB() {
  if (cached.conn) return cached.conn;

  cached.promise = mongoose.connect(MONGODB_URI, opts);
  cached.conn = await cached.promise;
  return cached.conn;
}
```

**MongoDB Models**

```typescript
// models.ts - Mongoose schemas
export const User = mongoose.model('User', userSchema);
export const File = mongoose.model('File', fileSchema);
export const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);
```

**Schema Features:**

- User management with roles
- File metadata and relationships
- Security event logging
- Automatic timestamps

### 🛡️ Security (`security.ts`)

**File Scanning System**

```typescript
// Malware detection
export async function scanFile(file: File): Promise<ScanResult> {
  const quickScan = await performQuickScan(file);

  if (quickScan.suspicious) {
    return await performDeepScan(file);
  }

  return quickScan;
}

// Security event logging
export async function logSecurityEvent(event: SecurityEventData) {
  await SecurityEvent.create({
    type: event.type,
    severity: event.severity,
    details: event.details,
    timestamp: new Date(),
  });
}
```

**Security Features:**

- Automatic file scanning
- VirusTotal integration
- Threat detection
- Security event logging
- Rate limiting integration

### ⚡ Rate Limiting (`rateLimit.ts`)

**Request Rate Control**

```typescript
export const rateLimitConfigs = {
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 uploads per window
    message: 'Too many uploads',
  },
  download: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100, // 100 downloads per window
  },
};

export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest) => {
    // Rate limiting logic
  };
}
```

**Protection Features:**

- Upload rate limiting
- Download rate limiting
- API endpoint protection
- IP-based tracking

## 🛠️ Utilities

### 📊 Constants (`constants.ts`)

**Application Configuration**

```typescript
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'audio/mpeg',
    'application/pdf',
    // ...
  ],
  EXPIRATION_OPTIONS: [
    { value: '1h', label: '1 Hour', ms: 60 * 60 * 1000 },
    { value: '24h', label: '24 Hours', ms: 24 * 60 * 60 * 1000 },
    // ...
  ],
};

export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 0.5,
  POLLING_INTERVALS: {
    FAST: 30 * 1000, // 30 seconds
    NORMAL: 60 * 1000, // 1 minute
    SLOW: 5 * 60 * 1000, // 5 minutes
  },
};
```

### 🔧 Common Utils (`utils.ts`)

**File Operations**

```typescript
// File size formatting
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// File validation
export function validateFileAdvanced(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Size validation
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File exceeds ${formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)} limit`);
  }

  // Type validation
  if (!UPLOAD_CONFIG.SUPPORTED_TYPES.includes(file.type)) {
    errors.push('File type not supported');
  }

  return { isValid: errors.length === 0, errors, warnings };
}
```

**Security Utils**

````typescript
// Client IP detection
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');

  if (forwarded) return forwarded.split(',')[0].trim();
  if (real) return real;
  return 'unknown';
}

### 📡 Query Management (`queryKeys.ts`)

**TanStack Query Key Management**
```typescript
export const queryKeys = {
  // File queries
  files: ['files'] as const,
  fileById: (id: string) => ['files', id] as const,
  userFiles: (userId: string) => ['files', 'user', userId] as const,

  // Statistics
  stats: ['stats'] as const,
  userStats: (userId: string) => ['stats', 'user', userId] as const,

  // Security
  security: ['security'] as const,
  securityEvents: ['security', 'events'] as const,

  // Activities
  activities: ['activities'] as const,
  userActivities: (userId: string) => ['activities', 'user', userId] as const,
} as const;
````

## 🔄 Background Services

### 🧹 Cleanup Service (`background-cleanup.ts`)

**Automated File Cleanup**

```typescript
export async function cleanupExpiredFiles(): Promise<CleanupStats> {
  const expiredFiles = await File.find({
    expiresAt: { $lt: new Date() },
    isDeleted: false,
  });

  let deletedCount = 0;
  let totalSize = 0;

  for (const file of expiredFiles) {
    try {
      // Delete physical file
      await unlink(path.join(UPLOADS_DIR, file.filename));

      // Mark as deleted in database
      await File.findByIdAndUpdate(file._id, { isDeleted: true });

      deletedCount++;
      totalSize += file.size;
    } catch (error) {
      console.error(`Failed to delete file ${file.filename}:`, error);
    }
  }

  return { deletedCount, totalSize };
}
```

### 🚀 Startup (`startup.ts`)

**Application Initialization**

```typescript
export async function initializeApplication() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Run initial cleanup
    const cleanupStats = await cleanupExpiredFiles();
    console.log(`🧹 Cleanup: ${cleanupStats.deletedCount} files removed`);

    // Schedule background tasks
    scheduleBackgroundTasks();
    console.log('⏰ Background tasks scheduled');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    process.exit(1);
  }
}
```

## 📡 API Integration

### 🌐 API Client (`api/`)

**Centralized API Communication**

```typescript
// api/client.ts
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }
}
```

### 🔔 Notifications (`notifications/`)

**Real-Time Notification System**

The notifications system uses TanStack Query for efficient polling-based real-time updates,
providing a more reliable alternative to Server-Sent Events for the Next.js environment.

## 🎯 Configuration Patterns

### 1. **Environment Configuration**

```typescript
const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/uploadhaven',
    options: { bufferCommands: false },
  },
  auth: {
    secret: process.env.BETTER_AUTH_SECRET,
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  upload: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image/*', 'video/*', 'application/pdf'],
  },
};
```

### 2. **Service Initialization**

```typescript
// lib/services.ts
export async function initializeServices() {
  await connectDB();
  await initializeAuth();
  await startBackgroundServices();
}
```

### 3. **Error Handling**

````typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

## 🧪 Testing Library Functions

```typescript
// __tests__/lib/utils.test.ts
import { formatFileSize, validateFileAdvanced } from '../utils';

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});

describe('validateFileAdvanced', () => {
  it('validates file size', () => {
    const largeFile = new File(['x'.repeat(200 * 1024 * 1024)], 'large.txt');
    const result = validateFileAdvanced(largeFile);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('File exceeds 100 MB limit');
  });
});
````

## 📚 Best Practices

1. **Error Handling** - Always handle errors gracefully
2. **Type Safety** - Use TypeScript for all functions
3. **Configuration** - Use environment variables for config
4. **Logging** - Log important operations and errors
5. **Testing** - Unit test utility functions
6. **Security** - Validate all inputs and sanitize data
7. **Performance** - Cache expensive operations
8. **Documentation** - Document complex business logic

## 🔗 Related Documentation

- **[Types Documentation](../types/README.md)** - Type definitions used by services
- **[Hooks Documentation](../hooks/README.md)** - Hooks that use these services
- **[Components Documentation](../components/README.md)** - Components that consume services
