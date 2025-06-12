# UploadHaven - Source Code Architecture

This document provides a comprehensive overview of the UploadHaven source code architecture and organizational patterns.

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
- **`security.ts`** - Security scanning & validation
- **`utils.ts`** - Common utilities
- **`constants.ts`** - Application constants

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

## 🔒 Security Considerations

- **Input Validation** - All user inputs validated
- **File Scanning** - Automatic malware detection
- **Rate Limiting** - API protection
- **Type Safety** - TypeScript strict mode
