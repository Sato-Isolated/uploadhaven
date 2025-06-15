# Contributing to UploadHaven

Thank you for your interest in contributing to UploadHaven! This document provides guidelines and information for contributors.

## 🚀 Quick Start for Contributors

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (recommended) or npm/yarn
- **MongoDB** (local or cloud instance)
- **Git** for version control

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/Sato-Isolated/uploadhaven.git
   cd uploadhaven
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## 📋 Development Guidelines

### Code Standards

#### TypeScript
- Use strict TypeScript mode
- Define proper types for all functions and components
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes

#### React/Next.js
- Use Server Components by default
- Only use `'use client'` when necessary for interactivity
- Follow Next.js App Router conventions
- Use proper file naming conventions

#### Styling
- Use Tailwind CSS utility classes
- Follow the existing component design patterns
- Use ShadCN/UI components when possible
- Maintain responsive design principles

#### File Organization
```
src/
├── components/
│   ├── ui/              # Base UI components (ShadCN/UI)
│   ├── domains/         # Feature-specific components
│   └── providers/       # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configs
├── types/               # TypeScript type definitions
└── app/                 # Next.js App Router pages and API routes
```

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(upload): add drag and drop file upload
fix(auth): resolve session persistence issue
docs(api): update authentication endpoint documentation
```

### Branch Naming

Use descriptive branch names:
- `feature/add-bulk-upload`
- `fix/notification-timing`
- `docs/update-api-guide`
- `refactor/file-management`

## 🧪 Testing

### Running Tests

```bash
# Run all tests (when implemented)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test FileUploader.test.tsx
```

### Writing Tests

- Write unit tests for utility functions and API endpoints
- Write component tests for React components using React Testing Library
- Write integration tests for file upload/download workflows
- Follow the existing test patterns (to be established in v1.1.0)

### Test Structure (Planned for v1.1.0)

```typescript
// Example test file structure
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileUploader } from './FileUploader'

describe('FileUploader Component', () => {
  it('should render upload area correctly', () => {
    render(<FileUploader />)
    expect(screen.getByText('Drop files here')).toBeInTheDocument()
  })

  it('should handle file selection', async () => {
    // Test implementation
  })
})
```

## 🔍 Code Review Process

### Before Submitting

1. **Self Review**
   - Check your code for style consistency
   - Ensure all tests pass
   - Update documentation if needed
   - Test your changes thoroughly

2. **Prepare Pull Request**
   - Use descriptive PR title and description
   - Link related issues
   - Add screenshots for UI changes
   - Ensure CI checks pass

### Review Criteria

We review PRs based on:
- **Code Quality**: Clean, readable, maintainable code
- **Functionality**: Works as intended, no breaking changes
- **Testing**: Adequate test coverage
- **Documentation**: Updated docs when necessary
- **Performance**: No significant performance regressions

## 🐛 Bug Reports

### Before Reporting

1. Search existing issues to avoid duplicates
2. Test with the latest version
3. Provide minimal reproduction steps

### Bug Report Template

```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 91]
- Node.js: [e.g., 18.17.0]
- UploadHaven version: [e.g., 1.0.0]

## Additional Context
Screenshots, logs, or other relevant information
```

## 💡 Feature Requests

### Before Requesting

1. Check if feature already exists or is planned
2. Search existing feature requests
3. Consider if it fits the project scope

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How do you envision this feature working?

## Alternatives Considered
Other approaches you've considered

## Additional Context
Mockups, examples, or related features
```

## 🏗️ Architecture Guidelines

### Component Design

- **Single Responsibility**: Each component should have one clear purpose
- **Reusability**: Design for reuse across different contexts
- **Composition**: Prefer composition over inheritance
- **Props Interface**: Clear, well-typed props

### State Management

- Use React state for local component state
- Use context for app-wide state (notifications, theme)
- Use server state for data fetching (TanStack Query)
- Minimize state complexity

### API Design

- Follow RESTful conventions
- Use proper HTTP status codes
- Include comprehensive error handling
- Validate input with Zod schemas

### Security Considerations

- Validate all user input
- Sanitize file uploads
- Use proper authentication checks
- Follow security best practices

## 📚 Documentation

### When to Update Documentation

- Adding new features
- Changing API endpoints
- Modifying configuration options
- Fixing bugs that affect usage

### Documentation Types

1. **API Documentation** (`docs/api-documentation.md`)
   - Update when adding/changing API endpoints
   - Include request/response examples
   - Document authentication requirements

2. **Technical Documentation** (`docs/TECHNICAL.md`)
   - Update for architecture changes
   - Add deployment instructions
   - Document development setup changes

3. **README Updates**
   - Update for major feature additions
   - Keep installation instructions current
   - Update badges and links

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Tag created and pushed
- [ ] Release notes prepared

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions

### Communication

- Use clear, descriptive language
- Provide context for your changes
- Ask questions when unsure
- Help others when possible

## 📞 Getting Help

### Resources

- **Documentation**: [docs/](./docs/)
- **API Reference**: [docs/api-documentation.md](./docs/api-documentation.md)
- **Technical Guide**: [docs/TECHNICAL.md](./docs/TECHNICAL.md)

### Support Channels

- **GitHub Issues**: For bugs and feature requests - [Issues](https://github.com/Sato-Isolated/uploadhaven/issues)
- **GitHub Discussions**: For general questions and ideas - [Discussions](https://github.com/Sato-Isolated/uploadhaven/discussions)
- **Email**: [ismyskyllz@gmail.com] for private matters

## 🎯 Project Roadmap

### Current Focus Areas

1. **Performance Optimization**
   - File upload/download speed improvements
   - Database query optimization
   - Caching strategies

2. **Security Enhancements**
   - Advanced malware detection
   - Enhanced rate limiting
   - Security audit improvements

3. **User Experience**
   - Improved mobile interface
   - Better file management tools
   - Enhanced notification system

### Future Plans

- File encryption at rest
- Advanced analytics dashboard
- Third-party integrations
- Mobile app development

---

Thank you for contributing to UploadHaven! Your contributions help make file sharing better for everyone. 🚀

For questions about contributing, please open an issue or reach out to the maintainers.
