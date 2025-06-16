# UploadHaven - Source Code Architecture

This document provides a comprehensive overview of the UploadHaven source code architecture and
organizational patterns.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router (Pages & API Routes)
├── components/             # React Components (Domain-Driven Architecture)
├── hooks/                  # Custom React Hooks
├── lib/                    # Utilities, Services & Configuration
├── types/                  # TypeScript Type Definitions
├── instrumentation.ts      # Next.js Instrumentation
└── middleware.ts           # Next.js Middleware
```

## 🏗️ Architecture Overview

UploadHaven follows a **Domain-Driven Design (DDD)** approach with clear separation of concerns:

### 🎯 Domain-Driven Components (`components/domains/`)

Each domain represents a specific business capability:

- **`auth/`** - Authentication (Sign In/Up, Forms)
- **`upload/`** - File Upload System (Dropzone, Progress, Settings)
- **`filepreview/`** - File Preview & Display
- **`dashboard/`** - User Dashboard & Stats
- **`admin/`** - Administrative Interface
- **`security/`** - Security Scanning & Events
- **`analytics/`** - Usage Analytics
- **`stats/`** - Statistics Panels
- **`files/`** - File Management

### 🪝 Custom Hooks (`hooks/`)

Business logic extraction following the **Single Responsibility Principle**:

- **Query Hooks** - Data fetching with TanStack Query
- **State Management** - Complex component state
- **Business Logic** - Reusable domain operations

### 📚 Libraries (`lib/`)

Core services and utilities:

- **`auth.ts`** - Better Auth configuration
- **`mongodb.ts`** - Database connection & models
- **`encryption.ts`** - File encryption utilities (Phase 2)
- **`thumbnail-encryption.ts`** - Encrypted thumbnail generation (Phase 2) 
- **`video-frame-extraction.ts`** - Video thumbnail extraction via ffmpeg
- **`pdf-thumbnail-extraction.ts`** - PDF thumbnail extraction via ImageMagick
- **`utils.ts`** - Shared utility functions

### 🔒 Phase 2 Encryption Features

#### **Thumbnail & Preview Encryption**

UploadHaven now includes advanced encryption for generated thumbnails and previews:

**Key Features:**
- **Encrypted Thumbnail Generation** - All thumbnails are encrypted at rest
- **Transparent Decryption** - Thumbnails are decrypted on-the-fly for serving
- **Video Frame Extraction** - Secure video thumbnail generation using ffmpeg
- **PDF Preview Support** - PDF page extraction using ImageMagick/GraphicsMagick
- **Intelligent Caching** - Encrypted thumbnails are cached for performance
- **Fallback Support** - Graceful degradation when external tools are unavailable

**Configuration:**
```bash
# Enable thumbnail encryption
THUMBNAIL_ENCRYPTION_ENABLED=true

# Cache settings
THUMBNAIL_CACHE_ENCRYPTED=true
THUMBNAIL_CACHE_SIZE=1000
THUMBNAIL_CACHE_DIR=cache/thumbnails

# Quality settings
THUMBNAIL_QUALITY=80
THUMBNAIL_SIZE=200
```

**Architecture:**
- **Generation**: Thumbnails are generated during upload and encrypted immediately
- **Storage**: Encrypted thumbnails are cached with metadata for quick retrieval
- **Serving**: Thumbnails are decrypted on-demand and served to clients
- **Cleanup**: Automated cache cleanup removes expired entries

### **File Encryption**
- Configurable encryption for uploaded files
- Multiple encryption algorithms (AES-256-GCM)
- User-provided or system-managed encryption keys
- Transparent decryption for authorized access

### 🏷️ Types (`types/`)

Centralized TypeScript definitions:

- **`file.ts`** - File management types
- **`security.ts`** - Security & scanning types
- **`components.ts`** - Component prop types
- **`api.ts`** - API response types

## 🎨 Design Patterns

### 1. Domain-Driven Architecture

```
components/domains/[domain]/
├── index.tsx              # Main component
├── components/            # Domain-specific components
├── hooks/                 # Domain-specific hooks
├── types.ts              # Domain-specific types
└── utils.ts              # Domain-specific utilities
```

### 2. Custom Hook Pattern

```typescript
// Business logic extraction
export function useFileUploader() {
  // State management
  // Side effects
  // Return interface
  return { state, actions };
}
```

### 3. Component Composition

```typescript
// Compound component pattern
<FileUploader>
  <FileUploader.Header />
  <FileUploader.Dropzone />
  <FileUploader.Progress />
</FileUploader>
```

### 4. Type-First Development

```typescript
// Centralized types with clear hierarchy
interface BaseFileData {
  readonly id: string;
  readonly name: string;
  // ...
}

interface ClientFileData extends BaseFileData {
  readonly shortUrl: string;
}
```

## 🔄 Data Flow

```
UI Component
    ↓
Custom Hook (Business Logic)
    ↓
API Client / Service
    ↓
Next.js API Route
    ↓
Database / External Service
```

## 🛠️ Development Guidelines

### File Organization

1. **Colocation** - Keep related files together
2. **Index Files** - Clean exports from folders
3. **Naming** - Descriptive and consistent naming
4. **Types** - Always type your components and hooks

### Import Strategy

```typescript
// Absolute imports from src
import { FileUploader } from '@/components/domains/upload';
import { useFileOperations } from '@/hooks';
import { validateFile } from '@/lib/utils';
import type { ClientFileData } from '@/types';
```

### Component Structure

```typescript
'use client'; // Only when needed

import { motion } from 'motion/react';
import { CustomHook } from '@/hooks';
import { UtilityFunction } from '@/lib/utils';
import type { ComponentProps } from '@/types';

interface ComponentProps extends BaseComponentProps {
  // Component-specific props
}

export default function Component({ prop }: ComponentProps) {
  const { state, actions } = useCustomHook();

  return (
    <motion.div>
      {/* JSX */}
    </motion.div>
  );
}
```

## 📚 Further Reading

- **[Components Documentation](components/README.md)** - Component architecture details
- **[Hooks Documentation](hooks/README.md)** - Custom hooks patterns
- **[Types Documentation](types/README.md)** - Type system overview
- **[Library Documentation](lib/README.md)** - Services and utilities

## 🧪 Testing Strategy

- **Unit Tests** - Individual functions and utilities
- **Component Tests** - React Testing Library
- **Integration Tests** - API and database operations
- **E2E Tests** - Complete user workflows

## 🛠️ Maintenance & Operations

### **Thumbnail Cache Cleanup**

Regular maintenance is required for optimal performance:

```bash
# Manual cleanup via script
pnpm tsx scripts/cleanup-thumbnails.ts

# Automated cleanup (recommended cron job)
# Run daily at 2 AM
0 2 * * * cd /path/to/uploadhaven && pnpm tsx scripts/cleanup-thumbnails.ts
```

**Cleanup Process:**
- Removes cache entries older than 7 days
- Cleans both thumbnail data and metadata files
- Logs cleanup activities for monitoring
- Safe to run while application is running

### **Monitoring**

Key metrics to monitor:
- **Cache Hit Rate** - Thumbnail cache effectiveness
- **Encryption Performance** - Time to encrypt/decrypt thumbnails
- **Storage Usage** - Cache directory size growth
- **Error Rates** - Failed thumbnail generations

## 🔒 Security Considerations

- **Input Validation** - All user inputs validated
- **File Scanning** - Automatic malware detection
- **Rate Limiting** - API protection
- **Type Safety** - TypeScript strict mode
- **File Encryption** - End-to-end encryption for sensitive files (Phase 2)
- **Thumbnail Encryption** - Encrypted preview generation and caching (Phase 2)

## 🎯 Phase 2 Encryption Features

### File Encryption
- Configurable encryption for uploaded files
- Multiple encryption algorithms (AES-256-GCM)
- User-provided or system-managed encryption keys
- Transparent decryption for authorized access

### Thumbnail & Preview Encryption
- ✅ **Encrypted Thumbnail Generation** - All thumbnails encrypted at rest
- ✅ **Multi-format Support** - Images, videos (ffmpeg), PDFs (ImageMagick)
- ✅ **Secure Caching** - Encrypted thumbnail cache with automatic cleanup
- ✅ **Transparent Serving** - Seamless decryption for authorized users
- ✅ **Fallback Handling** - Graceful degradation when tools unavailable

#### Environment Configuration
```bash
# Enable thumbnail encryption
THUMBNAIL_ENCRYPTION_ENABLED=true
THUMBNAIL_CACHE_ENCRYPTED=true
THUMBNAIL_CACHE_SIZE=1000
THUMBNAIL_QUALITY=80
THUMBNAIL_SIZE=200
```

#### Maintenance
```bash
# Clean up expired thumbnail cache
pnpm cleanup:thumbnails

# Install local media tools (Windows)
pnpm tools:install

# Check media tools installation
pnpm tools:check
```

#### Local Development Tools (Windows)
For enhanced thumbnail generation on Windows, install tools locally:

```bash
# Install FFmpeg and ImageMagick locally (no admin required)
pnpm tools:install

# This installs:
# - FFmpeg for video thumbnails
# - ImageMagick for PDF thumbnails
# - Tools are placed in tools/bin/ directory
# - Automatically detected by the application
```

For detailed documentation, see **[Thumbnail Encryption Guide](../docs/features/thumbnail-encryption.md)**.
