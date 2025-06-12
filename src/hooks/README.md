# Custom Hooks Documentation

UploadHaven uses custom React hooks to extract business logic from components, following the **Single Responsibility Principle** and enabling better code reuse and testing.

## 📁 Hook Categories

```
hooks/
├── index.ts                      # Main hook exports
├── useActivitiesQuery.ts         # Activity data fetching
├── useActivityManagement.ts      # Activity management logic
├── useAdminFileManager.ts        # Admin file operations
├── useAsyncOperation.ts          # Async operation state
├── useFileOperations.ts          # File CRUD operations
├── useFilePreview.ts             # File preview logic
├── useFilesQuery.ts              # File data fetching
├── useModal.ts                   # Modal state management
├── useNotifications.ts           # Real-time notifications
├── useRealTimePolling.ts         # Real-time data polling
├── useSecurityQuery.ts           # Security data fetching
├── useSecurityScanning.ts        # Security scanning logic
├── useStatsQuery.ts              # Statistics data fetching
├── useUserActivity.ts            # User activity tracking
├── useUserAnalytics.ts           # User analytics data
└── useUserStats.ts               # User statistics
```

## 🏗️ Hook Architecture Patterns

### 1. Query Hooks (Data Fetching)

These hooks use **TanStack Query** for efficient data fetching and caching:

```typescript
// Pattern: useXxxQuery.ts
export function useStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: fetchStatsData,
    refetchInterval: 60000, // 1 minute
  });
}
```

**Examples:**
- `useStatsQuery` - System statistics
- `useFilesQuery` - File listings
- `useActivitiesQuery` - Activity logs
- `useSecurityQuery` - Security events

### 2. Business Logic Hooks

Extract complex component logic into reusable hooks:

```typescript
// Pattern: useDomainLogic.ts
export function useFileOperations() {
  const [uploading, setUploading] = useState(false);
  
  const uploadFile = useCallback(async (file: File) => {
    // Business logic
  }, []);
  
  return { uploading, uploadFile };
}
```

**Examples:**
- `useFileOperations` - File CRUD operations
- `useSecurityScanning` - Security scan logic
- `useActivityManagement` - Activity tracking

### 3. State Management Hooks

Manage complex component state:

```typescript
// Pattern: useStateManagement.ts
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  
  return { isOpen, openModal, closeModal };
}
```

**Examples:**
- `useModal` - Modal state management
- `useAsyncOperation` - Async operation state

### 4. Real-Time Hooks

Handle real-time data and WebSocket connections:

```typescript
// Pattern: useRealTime.ts
export function useRealTimePolling<T>(
  queryKey: string[],
  fetcher: () => Promise<T>,
  options: PollingOptions = {}
) {
  // Real-time polling logic
}
```

**Examples:**
- `useRealTimePolling` - Generic polling
- `useNotifications` - Real-time notifications

## 🎯 Hook Categories Breakdown

### 📊 Data Fetching Hooks

**`useStatsQuery`**
```typescript
const { data: stats, isLoading, error, refetch } = useStatsQuery();
```
- System-wide statistics
- Auto-refresh capability
- Error handling

**`useFilesQuery`** 
```typescript
const { data: files, isLoading } = useFilesQuery({ userId });
```
- User file listings
- Pagination support
- Filtering options

**`useActivitiesQuery`**
```typescript
const { 
  data, 
  fetchNextPage, 
  hasNextPage,
  isLoading 
} = useActivitiesQuery();
```
- Infinite scroll activities
- Real-time updates
- Activity filtering

### 🔧 Business Logic Hooks

**`useFileOperations`**
```typescript
const { 
  uploading, 
  uploadFile, 
  deleteFile, 
  validateFile 
} = useFileOperations();
```
- File upload with progress
- File validation
- Delete operations
- Error handling

**`useSecurityScanning`**
```typescript
const {
  isScanning,
  scanProgress,
  scanResults,
  startScan,
  stopScan
} = useSecurityScanning();
```
- Security scan orchestration
- Progress tracking
- Result management

**`useAdminFileManager`**
```typescript
const {
  selectedFiles,
  toggleFileSelection,
  bulkDelete,
  exportData
} = useAdminFileManager(files);
```
- Bulk file operations
- Selection management
- Admin-specific actions

### 🎨 UI State Hooks

**`useModal`**
```typescript
const { 
  isOpen, 
  openModal, 
  closeModal, 
  toggleModal 
} = useModal();
```
- Modal state management
- Event handling
- Multiple modal support

**`useAsyncOperation`**
```typescript
const { 
  loading, 
  error, 
  execute, 
  reset 
} = useAsyncOperation();
```
- Async operation state
- Loading indicators
- Error handling

### 📱 Real-Time Hooks

**`useRealTimePolling`**
```typescript
const { 
  data, 
  isPolling, 
  startPolling, 
  stopPolling 
} = useRealTimePolling(queryKey, fetcher, options);
```
- Generic polling mechanism
- Configurable intervals
- Auto-cleanup

**`useNotifications`**
```typescript
const { 
  notifications, 
  unreadCount, 
  markAsRead, 
  clearAll 
} = useNotifications();
```
- Server-sent events
- Notification management
- Real-time updates

## 🔧 Hook Implementation Patterns

### 1. Custom Hook Structure

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { HookReturnType, HookOptions } from '@/types';

export interface UseCustomHookReturn {
  // State
  data: DataType | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  execute: (params: ParamType) => Promise<void>;
  reset: () => void;
}

export function useCustomHook(options: HookOptions = {}): UseCustomHookReturn {
  // State declarations
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Memoized actions
  const execute = useCallback(async (params: ParamType) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(params);
      setData(result);
      toast.success('Operation successful');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);
  
  // Return interface
  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
```

### 2. TanStack Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export function useDataWithMutation() {
  const queryClient = useQueryClient();
  
  // Query for data fetching
  const query = useQuery({
    queryKey: queryKeys.data,
    queryFn: fetchData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Mutation for data modification
  const mutation = useMutation({
    mutationFn: updateData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.data });
      toast.success('Data updated successfully');
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });
  
  return {
    ...query,
    updateData: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
```

### 3. Error Handling Pattern

```typescript
export function useWithErrorHandling<T, P>(
  operation: (params: P) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const execute = useCallback(async (params: P) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation(params);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [operation]);
  
  return { execute, loading, error };
}
```

## 📚 Best Practices

### 1. **Naming Convention**
- `useXxxQuery` - Data fetching hooks
- `useXxxMutation` - Data modification hooks  
- `useXxxLogic` - Business logic hooks
- `useXxxState` - State management hooks

### 2. **Return Interface**
```typescript
// Always return an object with descriptive names
return {
  // State
  data,
  loading,
  error,
  
  // Actions  
  execute,
  reset,
  refresh,
};
```

### 3. **Dependencies**
```typescript
// Minimize dependencies in useCallback/useMemo
const memoizedValue = useMemo(() => {
  return expensiveCalculation(dep1, dep2);
}, [dep1, dep2]); // Only essential dependencies
```

### 4. **Type Safety**
```typescript
// Always type hook parameters and return values
export function useTypedHook<T extends BaseType>(
  params: HookParams<T>
): HookReturn<T> {
  // Implementation
}
```

### 5. **Error Boundaries**
```typescript
// Handle errors gracefully
try {
  await operation();
} catch (error) {
  // Log error for debugging
  console.error('Operation failed:', error);
  
  // User-friendly error message
  toast.error('Something went wrong. Please try again.');
  
  // Update state
  setError(error.message);
}
```

## 🧪 Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCustomHook } from './useCustomHook';

describe('useCustomHook', () => {
  it('should handle successful operation', async () => {
    const { result } = renderHook(() => useCustomHook());
    
    await act(async () => {
      await result.current.execute({ param: 'value' });
    });
    
    expect(result.current.data).toBeTruthy();
    expect(result.current.error).toBeNull();
  });
});
```

## 🔗 Related Documentation

- **[Components Documentation](../components/README.md)** - Component integration
- **[Types Documentation](../types/README.md)** - Hook type definitions
- **[Library Documentation](../lib/README.md)** - Utility functions used by hooks
