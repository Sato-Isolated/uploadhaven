# Next.js App Router Documentation

This directory contains the Next.js 15 App Router structure for UploadHaven, implementing a modern file-based routing system with comprehensive API endpoints and page layouts.

## 📁 Directory Structure

```
app/
├── globals.css              # Global styles and Tailwind CSS imports
├── layout.tsx               # Root layout component (RootLayout)
├── page.tsx                 # Home page (landing page)
├── favicon.ico              # Application favicon
│
├── api/                     # API Routes (Next.js Route Handlers)
│   ├── admin/               # Admin-only API endpoints
│   ├── analytics/           # Analytics and metrics endpoints
│   ├── auth/                # Authentication endpoints (Better Auth)
│   ├── background-service/  # Background service controls
│   ├── bulk-delete/         # Bulk file operations
│   ├── cleanup/             # File cleanup operations
│   ├── download/            # File download handlers
│   ├── events/              # Event tracking endpoints
│   ├── files/               # File management operations
│   ├── notifications/       # User notifications
│   ├── preview/             # File preview generation
│   ├── preview-file/        # Individual file previews
│   ├── security/            # Security scanning and monitoring
│   ├── stats/               # System statistics
│   ├── thumbnail/           # Image thumbnail generation
│   ├── upload/              # File upload handlers
│   └── user/                # User-specific operations
│
├── admin/                   # Admin interface pages
│   └── page.tsx             # Admin dashboard
│
├── auth/                    # Authentication pages
│   ├── signin/              # Sign-in page
│   ├── signup/              # Sign-up page
│   └── ...                  # Other auth-related pages
│
├── dashboard/               # User dashboard pages
│   └── page.tsx             # User dashboard
│
├── performance/             # Performance testing pages
│   └── page.tsx             # Performance metrics and testing
│
└── s/                       # Short URL redirects
    └── [shortId]/           # Dynamic short URL handler
        └── page.tsx         # Short URL redirect page
```

## 🎯 Architecture Overview

### 📄 Page Structure

UploadHaven follows Next.js 15 App Router conventions with clear separation between public and authenticated areas:

#### **Public Pages**
- **`page.tsx`** - Landing page with file upload interface and information panels
- **`auth/`** - Authentication flows (sign-in, sign-up, password reset)
- **`s/[shortId]/`** - Public short URL redirects for file sharing

#### **Protected Pages**
- **`dashboard/`** - User dashboard with file management and analytics
- **`admin/`** - Administrative interface (role-based access)
- **`performance/`** - Performance testing and monitoring tools

### 🛡️ Middleware Protection

Routes are protected by `src/middleware.ts`:

```typescript
// Protected routes requiring authentication
const protectedRoutes = ['/dashboard', '/admin'];

// File access protection
- /uploads/public/* - Direct access allowed
- /uploads/protected/* - Access blocked (password-protected)
```

## 🔌 API Architecture

### 📊 API Organization

APIs are organized by domain and functionality:

#### **Core File Operations**
```typescript
// File Management
POST   /api/upload              # File upload with security scanning
GET    /api/files/[filename]    # File download and access
DELETE /api/files/[filename]/delete # File deletion
GET    /api/preview/[filename]  # File preview generation

// Bulk Operations
POST   /api/bulk-delete         # Bulk file deletion
POST   /api/cleanup             # System cleanup operations
```

#### **User Operations**
```typescript
// User Files
GET    /api/user/files          # User's file list with pagination
GET    /api/user/stats          # User-specific statistics
POST   /api/user/activity       # Activity tracking

// User Analytics
GET    /api/analytics/user      # User analytics and usage patterns
```

#### **Admin Operations**
```typescript
// Admin Dashboard
GET    /api/admin/users         # User management
GET    /api/admin/activities    # System activity logs
GET    /api/admin/files         # All files administration

// System Management
GET    /api/stats               # System-wide statistics
POST   /api/background-service  # Background service controls
```

#### **Security & Monitoring**
```typescript
// Security Scanning
POST   /api/security/scan/bulk  # Bulk malware scanning
GET    /api/security/files      # Security file listing
GET    /api/security/events     # Security event monitoring

// Event Tracking
POST   /api/events              # Event logging
GET    /api/events/recent       # Recent events
```

#### **Authentication (Better Auth)**
```typescript
// Authentication Flow
POST   /api/auth/signin         # User sign-in
POST   /api/auth/signup         # User registration
POST   /api/auth/signout        # User logout
GET    /api/auth/session        # Session validation
```

### 🔐 Authentication & Authorization

#### **Session Management**
- **Better Auth Integration** - Modern authentication with session management
- **Middleware Protection** - Route-level authentication checks
- **Role-Based Access** - Admin vs. user permissions

#### **Security Features**
- **Rate Limiting** - Request throttling per endpoint
- **File Scanning** - Malware detection on uploads
- **Event Logging** - Security event tracking
- **IP Tracking** - Request origin monitoring

## 📱 Page Components

### 🏠 Root Layout (`layout.tsx`)

```typescript
// Global application shell
- Theme provider (dark/light mode)
- Authentication provider
- Query client provider (TanStack Query)
- Toast notifications (Sonner)
- Font configuration (Geist Sans & Mono)
```

### 🎯 Landing Page (`page.tsx`)

```typescript
// Main upload interface
- Hero section with upload zone
- Feature highlights
- API documentation
- Usage statistics
- FAQ section
```

### 📊 Dashboard (`dashboard/page.tsx`)

```typescript
// User file management
- File upload interface
- Personal file gallery
- Usage statistics
- Activity timeline
- Settings panel
```

### 🛠️ Admin Panel (`admin/page.tsx`)

```typescript
// Administrative interface
- System statistics dashboard
- User management
- File administration
- Security monitoring
- Analytics overview
```

## 🚀 Route Handlers (API)

### 📤 File Upload Flow

```typescript
// Upload Process
1. POST /api/upload
   ├── Rate limiting check
   ├── File validation (type, size)
   ├── Security scanning
   ├── Database storage
   └── Short URL generation

2. Background Processing
   ├── Thumbnail generation
   ├── Metadata extraction
   └── Event logging
```

### 📥 File Download Flow

```typescript
// Download Process
1. GET /api/files/[filename]
   ├── Authentication check (if protected)
   ├── File existence validation
   ├── Download tracking
   └── Stream file response

2. Analytics Tracking
   ├── Download count increment
   ├── User activity logging
   └── Usage analytics
```

### 🔍 Security Scanning

```typescript
// Security Process
1. File Upload Scanning
   ├── MIME type validation
   ├── File signature checking
   ├── VirusTotal integration
   └── Threat assessment

2. Bulk Scanning
   ├── POST /api/security/scan/bulk
   ├── Batch file processing
   ├── Quota management
   └── Result aggregation
```

## 📊 Data Flow Patterns

### 🔄 Real-time Updates

```typescript
// Polling-based Updates
- Dashboard statistics (every 30 seconds)
- File upload progress (real-time)
- Security scan results (polling)
- Admin activity monitoring (live updates)
```

### 📝 Event Logging

```typescript
// Security Events
- User authentication (login/logout)
- File operations (upload/download/delete)
- Security threats (malware detection)
- System activities (cleanup, scanning)
```

### 📈 Analytics Integration

```typescript
// User Analytics
- Upload patterns and frequency
- File type preferences
- Storage usage trends
- Activity timeline tracking
```

## 🎨 Styling & UI

### 🎭 Theme System

```typescript
// Global Styles (globals.css)
- Tailwind CSS integration
- Dark/light mode variables
- Custom component styles
- Responsive design utilities
```

### 🎨 Component Integration

```typescript
// UI Component Usage
- ShadCN/UI components throughout
- Motion.dev animations (not Framer Motion)
- Consistent design system
- Responsive layouts
```

## 🔧 Configuration & Environment

### ⚙️ API Configuration

```typescript
// Base Configuration
BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
ENDPOINTS: {
  FILES: '/api/files',
  UPLOAD: '/api/upload',
  STATS: '/api/stats',
  SECURITY: '/api/security',
  ADMIN: '/api/admin',
}
```

### 🔐 Security Configuration

```typescript
// Rate Limiting
UPLOAD: { requests: 10, windowMs: 60 * 1000 }
DOWNLOAD: { requests: 50, windowMs: 60 * 1000 }
API: { requests: 100, windowMs: 60 * 1000 }
```

## 🔄 Background Services

### 🧹 Cleanup Services

```typescript
// Automated Cleanup
- Expired file deletion
- Orphaned file removal
- Database optimization
- Log rotation
```

### 📊 Monitoring Services

```typescript
// System Monitoring
- Performance metrics collection
- Error tracking and logging
- Usage analytics aggregation
- Health check endpoints
```

---

## 🎯 Best Practices

### 📝 API Development

1. **Consistent Response Format** - All APIs return standardized JSON responses
2. **Error Handling** - Comprehensive error catching and logging
3. **Rate Limiting** - Per-endpoint request throttling
4. **Security First** - Authentication and authorization on all protected routes

### 🎨 Page Development

1. **Server Components First** - Use Server Components by default
2. **Client Components** - Only when interactivity is required
3. **Loading States** - Proper loading indicators and error boundaries
4. **Responsive Design** - Mobile-first approach with Tailwind CSS

### 🔐 Security Practices

1. **Input Validation** - All user inputs validated and sanitized
2. **File Scanning** - Malware detection on all uploads
3. **Event Logging** - Comprehensive security event tracking
4. **Access Control** - Role-based permissions and middleware protection

This App Router structure provides a solid foundation for UploadHaven's file sharing capabilities while maintaining security, performance, and user experience standards.
