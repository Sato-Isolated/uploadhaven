# TypeScript Types Documentation

UploadHaven uses a **centralized type system** to ensure consistency and type safety across the
entire application. All types are organized by domain and exported from a single source of truth.

## 📁 Type System Structure

```
types/
├── index.ts              # Central type exports (main entry point)
├── api.ts                # API responses and requests
├── auth.ts               # Authentication and user types
├── components.ts         # Component props and UI state
├── database.ts           # Database model interfaces
├── events.ts             # Events and activities
├── file.ts               # File management (core types)
├── hooks.ts              # Hook configuration types
├── security.ts           # Security and scanning types
├── stats.ts              # Statistics and analytics
├── upload.ts             # File upload operations
└── utils.ts              # Utility and helper types
```

## 🎯 Type Architecture Principles

### 1. **Single Source of Truth**

All types are imported from `@/types`:

```typescript
import type { ClientFileData, ApiResponse, SecurityEvent } from '@/types';
```

### 2. **Hierarchical Type Design**

Base types are extended for specific use cases:

```typescript
// Base file data
interface BaseFileData {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  // ...
}

// Client-specific file data
interface ClientFileData extends BaseFileData {
  readonly shortUrl: string;
  readonly expiresAt?: string | null;
}

// Admin-specific file data
interface AdminFileData extends BaseFileData {
  readonly userId?: string;
  readonly userName?: string;
  readonly isAnonymous: boolean;
}
```

### 3. **Domain-Specific Organization**

Types are grouped by business domain:

- **File Management** (`file.ts`) - Core file operations
- **Security** (`security.ts`) - Scanning and threats
- **Authentication** (`auth.ts`) - Users and sessions
- **Components** (`components.ts`) - UI and props

## 📋 Core Type Categories

### 📁 File Management (`file.ts`)

The foundation of UploadHaven's type system:

```typescript
// Core file type hierarchy
export type FileType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

export interface BaseFileData {
  readonly id: string;
  readonly name: string;
  readonly originalName: string;
  readonly size: number;
  readonly mimeType: string;
  readonly uploadDate: string;
  readonly downloadCount: number;
  readonly type: FileType;
}

// Client-side file data (user interfaces)
export interface ClientFileData extends BaseFileData {
  readonly expiresAt?: string | null;
  readonly shortUrl: string;
}

// Admin-side file data (admin interfaces)
export interface AdminFileData extends BaseFileData {
  readonly userId?: string;
  readonly userName?: string;
  readonly isAnonymous: boolean;
}

// Upload process file data
export interface UploadedFile {
  readonly id: string;
  readonly file: File;
  progress: number;
  status: FileUploadStatus;
  url?: string;
  shortUrl?: string;
  error?: string;
  scanResult?: { safe: boolean; threat?: string };
  generatedKey?: string;
}
```

**Type Guards & Utilities:**

```typescript
// Type safety helpers
export function isClientFileData(obj: unknown): obj is ClientFileData;
export function isAdminFileData(obj: unknown): obj is AdminFileData;

// Data transformation utilities
export function toClientFileData(dbFile: IFile): ClientFileData;
export function toAdminFileData(dbFile: IFile, userName?: string): AdminFileData;
```

### 🔒 Security Types (`security.ts`)

Security scanning and threat detection:

```typescript
export type ScanType = 'quick' | 'full' | 'custom';

export interface ScanResult {
  safe: boolean;
  threat?: string;
  scanDate?: Date;
  source?: string;
  isMalicious?: boolean;
  isSuspicious?: boolean;
  threatName?: string;
}

export interface VirusTotalResponse {
  data: {
    attributes: {
      last_analysis_stats: {
        malicious: number;
        suspicious: number;
        undetected: number;
        harmless: number;
      };
      last_analysis_results: Record<
        string,
        {
          category: string;
          engine_name: string;
          result: string | null;
        }
      >;
    };
  };
}

export interface QuotaStatus {
  used: number;
  allowed: number;
  remaining: number;
  resetTime?: Date;
}
```

### 🔐 Authentication (`auth.ts`)

User management and authentication:

```typescript
export interface BaseUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: 'user' | 'admin';
  readonly emailVerified: boolean;
  readonly createdAt: string;
}

export interface ExtendedUser extends BaseUser {
  readonly lastActivity?: string;
  readonly storageUsed?: number;
  readonly fileCount?: number;
}

// Session type (from better-auth)
export interface User extends BaseUser {
  readonly image?: string;
  readonly updatedAt: string;
}
```

### 🎨 Component Props (`components.ts`)

UI component interfaces:

```typescript
// Base props for all components
export interface BaseComponentProps {
  className?: string;
  loading?: boolean;
  error?: string | null;
}

// Data component props
export interface DataComponentProps<T> extends BaseComponentProps {
  data?: T;
  onRefresh?: () => void;
}

// Action component props
export interface ActionComponentProps extends BaseComponentProps {
  onAction?: () => void;
  actionLoading?: boolean;
  disabled?: boolean;
}

// Modal state management
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

export interface UseModalReturn {
  isOpen: boolean;
  data: unknown;
  openModal: (data?: unknown) => void;
  closeModal: () => void;
  toggleModal: (data?: unknown) => void;
}
```

### 🌐 API Types (`api.ts`)

API communication interfaces:

```typescript
// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination for data listings
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// API client configuration
export interface ApiOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}
```

### 📊 Statistics (`stats.ts`)

Analytics and statistics:

```typescript
export interface BaseStats {
  totalFiles: number;
  totalUsers: number;
  totalSize: number; // in bytes
  totalDownloads: number;
  storageUsed: number;
}

export interface UserStats {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  storageUsed: number;
  filesUploaded24h: number;
  filesUploaded7d: number;
  recentFiles: ClientFileData[];
}

export interface SecurityStats {
  totalScans: number;
  threatsDetected: number;
  threatsBlocked: number;
  lastScanDate: string;
  riskLevel: 'low' | 'medium' | 'high';
}
```

### 📤 Upload Operations (`upload.ts`)

File upload system types:

```typescript
export type FileUploadStatus = 'scanning' | 'uploading' | 'completed' | 'error' | 'threat_detected';

export interface FileUploadOptions {
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export interface UploadSettingsProps extends BaseComponentProps {
  expiration: string;
  isPasswordProtected: boolean;
  onExpirationChange: (value: string) => void;
  onPasswordProtectionChange: (value: boolean) => void;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  expiresAt?: string;
  downloadCount: number;
  isPasswordProtected: boolean;
}
```

### 🗄️ Database Models (`database.ts`)

MongoDB document interfaces:

```typescript
// User document structure
export interface IUser {
  readonly _id: string;
  readonly name: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly image?: string;
  readonly role: 'user' | 'admin';
  readonly lastActivity: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// File document structure
export interface IFile {
  readonly _id: string;
  readonly filename: string;
  readonly shortUrl: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadDate: Date;
  readonly expiresAt: Date;
  readonly downloadCount: number;
  readonly ipAddress: string;
  readonly userAgent?: string;
  readonly scanResult: {
    safe: boolean;
    threat?: string;
    scanDate?: Date;
  };
  readonly isDeleted: boolean;
  readonly userId?: string;
  readonly isAnonymous: boolean;
  readonly password?: string;
  readonly isPasswordProtected: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Security event document
export interface ISecurityEvent {
  readonly _id: string;
  readonly type: SecurityEventType;
  readonly severity: SecuritySeverity;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly userId?: string;
  readonly createdAt: Date;
}
```

## 🎯 Type Usage Patterns

### 1. **Component Type Safety**

```typescript
import type { ClientFileData, BaseComponentProps } from '@/types';

interface FileCardProps extends BaseComponentProps {
  file: ClientFileData;
  onDownload: (file: ClientFileData) => void;
  onDelete: (fileId: string) => void;
}

export default function FileCard({ file, onDownload, onDelete }: FileCardProps) {
  // Component implementation with full type safety
}
```

### 2. **Hook Return Types**

```typescript
import type { ClientFileData, ApiResponse } from '@/types';

export interface UseFilesReturn {
  files: ClientFileData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  uploadFile: (file: File) => Promise<ApiResponse<ClientFileData>>;
  deleteFile: (id: string) => Promise<void>;
}

export function useFiles(): UseFilesReturn {
  // Hook implementation
}
```

### 3. **API Route Types**

```typescript
import type { ApiResponse, ClientFileData } from '@/types';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
  const response: ApiResponse<ClientFileData[]> = {
    success: true,
    data: files,
  };

  return Response.json(response);
}
```

### 4. **Type Guards for Runtime Safety**

```typescript
// Runtime type checking
function processFileData(data: unknown): ClientFileData {
  if (!isClientFileData(data)) {
    throw new Error('Invalid file data structure');
  }

  return data; // TypeScript knows this is ClientFileData
}
```

## 🛠️ Type Utilities

### Generic Utility Types

```typescript
// Utility types for common patterns
export type CallbackFunction<T = void> = () => T;
export type AsyncCallbackFunction<T = void> = () => Promise<T>;

export type TimeRange = {
  start: Date;
  end: Date;
};

export type ExportDataType = 'users' | 'files' | 'security-events';

// Make all properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

### Domain-Specific Utilities

```typescript
// File-related utilities
export type FileWithUser = ClientFileData & {
  user?: Pick<BaseUser, 'id' | 'name' | 'email'>;
};

// API response utilities
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: PaginationData;
};

// Component prop utilities
export type ComponentWithData<T> = BaseComponentProps & {
  data: T;
  loading?: boolean;
};
```

## 📚 Best Practices

### 1. **Readonly Properties**

```typescript
// Use readonly for immutable data
export interface FileData {
  readonly id: string;
  readonly name: string;
  // ...
}
```

### 2. **Strict Typing**

```typescript
// Use literal types for constrained values
export type FileStatus = 'uploading' | 'completed' | 'error';
export type UserRole = 'user' | 'admin';
```

### 3. **Generic Types**

```typescript
// Use generics for reusable patterns
export interface DataResponse<T> {
  data: T;
  metadata: {
    total: number;
    page: number;
  };
}
```

### 4. **Type Assertions with Guards**

```typescript
// Always use type guards instead of direct assertions
if (isClientFileData(data)) {
  // TypeScript knows data is ClientFileData
  console.log(data.shortUrl);
}
```

### 5. **Extending Base Types**

```typescript
// Build type hierarchies logically
interface BaseEntity {
  readonly id: string;
  readonly createdAt: string;
}

interface User extends BaseEntity {
  readonly email: string;
  readonly name: string;
}
```

## 🧪 Type Testing

```typescript
// Type-only tests to ensure type safety
import type { ClientFileData, AdminFileData } from '@/types';

// Test type compatibility
const clientFile: ClientFileData = {
  id: '1',
  name: 'test.txt',
  // ... other required properties
};

const adminFile: AdminFileData = {
  ...clientFile,
  userId: 'user123',
  isAnonymous: false,
};

// Test type guards
import { isClientFileData } from '@/types';

describe('Type Guards', () => {
  it('should correctly identify ClientFileData', () => {
    expect(isClientFileData(clientFile)).toBe(true);
    expect(isClientFileData({})).toBe(false);
  });
});
```

## 🔗 Integration Examples

### Component Integration

```typescript
import type { ClientFileData, UseModalReturn } from '@/types';

export default function FileManager() {
  const modal: UseModalReturn = useModal();
  const files: ClientFileData[] = useFiles();

  return (
    <div>
      {files.map((file: ClientFileData) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}
```

### API Integration

```typescript
import type { ApiResponse, ClientFileData } from '@/types';

export async function uploadFile(file: File): Promise<ClientFileData> {
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result: ApiResponse<ClientFileData> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.data;
}
```

## 🔗 Related Documentation

- **[Components Documentation](../components/README.md)** - Component prop types
- **[Hooks Documentation](../hooks/README.md)** - Hook return types
- **[Library Documentation](../lib/README.md)** - Service parameter types
- **[API Documentation](../../docs/api/reference.md)** - API request/response types
