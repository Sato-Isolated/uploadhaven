# Development Setup

Complete guide for setting up UploadHaven for development.

## Development Environment

### Prerequisites
- Node.js 18.17+
- pnpm 8.0+ (recommended)
- MongoDB 4.4+
- Git
- VS Code (recommended)

### Project Structure
```
uploadhaven/
├── src/                    # Application source code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript definitions
├── docs/                  # Documentation
├── public/                # Static assets
└── scripts/               # Utility scripts
```

## Setup Instructions

### 1. Fork & Clone
```bash
# Fork the repository on GitHub first
git clone https://github.com/YOUR-USERNAME/uploadhaven.git
cd uploadhaven
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration
```bash
cp .env.example .env.local
```

Development environment variables:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/uploadhaven-dev

# Authentication
AUTH_SECRET=dev-secret-key-change-in-production

# Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./public/uploads
ALLOWED_FILE_TYPES=image/*,text/*,application/pdf

# Development Features
NODE_ENV=development
ENABLE_DEBUG_LOGS=true

# Security (Development)
ENABLE_MALWARE_SCANNING=false
RATE_LIMIT_ENABLED=false

# Optional: External Services
VIRUSTOTAL_API_KEY=your-virustotal-key
```

### 4. Database Setup
```bash
# Start MongoDB locally
mongod --dbpath /path/to/data

# Or use Docker
docker run -d -p 27017:27017 --name uploadhaven-mongo mongo:latest
```

### 5. Start Development Server
```bash
pnpm dev
```

## Development Workflow

### Scripts Available
```bash
# Development
pnpm dev                   # Start development server (with Turbopack)
pnpm build                 # Build for production
pnpm start                 # Start production server

# Code Quality & Maintenance
pnpm lint                  # Run ESLint
pnpm cleanup              # Clean expired files and maintenance
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Run tests with coverage

# Database
pnpm db:seed              # Seed database with test data
pnpm db:reset             # Reset database
```

### Code Standards

#### TypeScript
- Use strict TypeScript configuration
- Define proper types for all API responses
- Use interfaces for component props
- Leverage utility types when appropriate

#### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Follow the component folder structure:
  ```
  components/
  ├── domains/
  │   ├── upload/
  │   │   ├── UploadArea.tsx
  │   │   ├── UploadProgress.tsx
  │   │   └── index.ts
  ```

#### API Routes
- Follow RESTful conventions
- Implement proper error handling
- Use middleware for common functionality
- Document all endpoints

### Git Workflow

#### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation updates
- `refactor/component-name` - Code refactoring

#### Commit Messages
Follow conventional commits:
```
feat: add file expiration feature
fix: resolve upload progress calculation
docs: update API documentation
refactor: simplify file validation logic
```

### IDE Setup (VS Code)

Recommended extensions:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

Settings:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Debugging

### Development Tools
- **React DevTools**: Browser extension for React debugging
- **MongoDB Compass**: GUI for MongoDB
- **Next.js DevTools**: Built-in development features

### Common Issues

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la public/uploads/

# Monitor upload events
tail -f .next/server.log
```

#### Database Connection
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/uploadhaven-dev

# Check MongoDB status
brew services list | grep mongodb  # macOS
systemctl status mongod            # Linux
```

#### Type Errors
```bash
# Clear Next.js cache
rm -rf .next/

# Rebuild TypeScript info
pnpm type-check
```

## Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- Hook testing with testing utilities
- Utility function testing

### Integration Tests
- API endpoint testing
- Database operation testing
- File upload flow testing

### E2E Tests
- User workflow testing
- File sharing scenarios
- Admin functionality testing

## Performance Optimization

### Development
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Monitor bundle size

### Monitoring
```bash
# Analyze bundle size
pnpm build && npx @next/bundle-analyzer
```

## Contributing

See [Contributing Guide](./contributing.md) for detailed contribution guidelines.

## Next Steps

- [API Reference](../api/reference.md)
- [Component Documentation](../components/README.md)
- [Testing Guide](./testing.md)
