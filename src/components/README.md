# Components Architecture

UploadHaven uses a **Domain-Driven Design (DDD)** approach for component organization, where each domain represents a specific business capability.

## 📁 Structure Overview

```
components/
├── domains/               # Business domain components
│   ├── auth/             # Authentication domain
│   ├── upload/           # File upload domain  
│   ├── filepreview/      # File preview domain
│   ├── dashboard/        # User dashboard domain
│   ├── admin/            # Administrative domain
│   ├── security/         # Security scanning domain
│   ├── analytics/        # Analytics domain
│   ├── stats/            # Statistics domain
│   ├── files/            # File management domain
│   └── ui/               # Shared UI utilities
├── providers/            # React context providers
└── ui/                   # Base UI components (ShadCN/UI)
```

## 🏗️ Domain Architecture Pattern

Each domain follows a consistent structure:

```
domains/[domain]/
├── index.tsx             # Main domain component & exports
├── [DomainName].tsx      # Primary component
├── components/           # Domain-specific sub-components
│   ├── [Component].tsx
│   └── index.ts          # Component exports
├── hooks/                # Domain-specific hooks
│   ├── use[Domain][Action].ts
│   └── index.ts          # Hook exports
├── types.ts              # Domain-specific types
├── utils.ts              # Domain-specific utilities
└── README.md             # Domain documentation
```

## 🎯 Domain Breakdown

### 🔐 Authentication (`auth/`)

Handles user authentication and account management.

**Components:**
- `SignInForm` - User login interface
- `SignUpForm` - User registration interface
- Form components with validation and error handling

**Key Features:**
- Better Auth integration
- Form validation with real-time feedback
- Responsive design with motion animations

### 📤 Upload (`upload/`)

Core file upload functionality with drag & drop interface.

**Components:**
- `FileUploader` - Main upload interface
- `DashboardUploadArea` - Dashboard-specific upload
- `DropzoneArea` - Drag & drop zone
- `FileProgressList` - Upload progress tracking
- `UploadSettings` - Expiration and password settings

**Key Features:**
- Drag & drop file upload
- Real-time progress tracking
- File validation and security scanning
- Batch upload support

### 👁️ File Preview (`filepreview/`)

File preview and display system supporting multiple file types.

**Components:**
- `FilePreviewClient` - Main preview container
- `ImagePreview` - Image file preview
- `VideoPreview` - Video file preview
- `TextPreview` - Text file preview
- `PDFPreview` - PDF file preview
- `AudioPreview` - Audio file preview

**Key Features:**
- Multi-format file preview
- Password-protected file access
- Download and sharing actions
- Security notices for scanned files

### 📊 Dashboard (`dashboard/`)

User dashboard with file management and analytics.

**Components:**
- `DashboardClient` - Main dashboard layout
- `DashboardHeader` - Navigation and actions
- `QuickActionCards` - Quick access buttons
- `ClientUserStats` - User statistics display

**Key Features:**
- Real-time file statistics
- Quick upload access
- User activity tracking
- Responsive layout

### ⚙️ Admin (`admin/`)

Administrative interface for system management.

**Components:**
- `AdminDashboard` - Main admin interface
- `AdminFileManager` - File management tools
- `UserManagement` - User administration
- `FilesTable` - Advanced file listing
- `PerformanceTest` - System performance monitoring

**Key Features:**
- System statistics and monitoring
- User and file management
- Bulk operations
- Security event tracking
- Data export functionality

### 🛡️ Security (`security/`)

Security scanning and threat detection system.

**Components:**
- `SecurityScanModal` - Security scanning interface
- `SecurityPanel` - Security status overview
- `SecurityEventsList` - Security event history
- `ScanProgress` - Real-time scan progress
- `ScanResults` - Scan result display

**Key Features:**
- Automatic malware scanning
- VirusTotal integration
- Security event logging
- Threat detection and quarantine

### 📈 Analytics (`analytics/`)

Usage analytics and reporting system.

**Components:**
- `UserAnalytics` - User-specific analytics
- `AnalyticsOverview` - System-wide analytics
- `TrendsChart` - Data visualization
- `TopFilesSection` - Popular files display

**Key Features:**
- Download tracking
- Usage trends
- File popularity metrics
- User behavior analytics

## 🧩 Component Patterns

### 1. Compound Components

```typescript
// Main component with sub-components
export default function FileUploader() {
  return (
    <FileUploader.Container>
      <FileUploader.Header />
      <FileUploader.Dropzone />
      <FileUploader.Progress />
    </FileUploader.Container>
  );
}

// Export pattern
FileUploader.Container = FileUploaderContainer;
FileUploader.Header = FileUploaderHeader;
// ...
```

### 2. Hook Integration

```typescript
export default function Component() {
  // Business logic in custom hooks
  const { state, actions } = useDomainLogic();
  
  return (
    <motion.div>
      {/* Presentation logic only */}
    </motion.div>
  );
}
```

### 3. Type Safety

```typescript
interface ComponentProps extends BaseComponentProps {
  data: DomainSpecificType;
  onAction: (param: TypedParameter) => void;
}
```

### 4. Motion Integration

```typescript
import { motion } from 'motion/react';

export default function Component() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Content */}
    </motion.div>
  );
}
```

## 📱 UI Components (`ui/`)

Base components from ShadCN/UI with customizations:

- **Form Controls** - Input, Button, Select, Checkbox
- **Layout** - Card, Dialog, Tabs, Separator  
- **Feedback** - Toast, Progress, Badge, Alert
- **Navigation** - Breadcrumb, Pagination

## 🔧 Providers (`providers/`)

React context providers for global state:

- **QueryProvider** - TanStack Query configuration
- **ThemeProvider** - Dark/light theme management
- **SessionProvider** - Authentication state

## 🎨 Styling Approach

- **Tailwind CSS** - Utility-first styling
- **CSS Variables** - Theme customization
- **Motion.dev** - Smooth animations
- **Responsive Design** - Mobile-first approach

## 🧪 Testing Strategy

```typescript
// Component testing example
import { render, screen } from '@testing-library/react';
import { FileUploader } from './FileUploader';

describe('FileUploader', () => {
  it('renders upload interface', () => {
    render(<FileUploader />);
    expect(screen.getByText('Drop files here')).toBeInTheDocument();
  });
});
```

## 📚 Best Practices

1. **Single Responsibility** - Each component has one clear purpose
2. **Composition over Inheritance** - Use compound components
3. **Props Interface** - Always type component props
4. **Error Boundaries** - Graceful error handling
5. **Accessibility** - ARIA attributes and keyboard navigation
6. **Performance** - Lazy loading and memoization when needed

## 🔗 Related Documentation

- **[Hooks Documentation](../hooks/README.md)** - Custom hooks used by components
- **[Types Documentation](../types/README.md)** - Component type definitions
- **[UI Components](ui/README.md)** - Base UI component documentation
