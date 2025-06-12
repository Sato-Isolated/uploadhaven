# Quick Start Guide

Get UploadHaven running in 5 minutes! This guide covers the essentials to get you started quickly.

## 🚀 5-Minute Setup

### 1. Prerequisites Check
Make sure you have:
- Node.js 18+ installed
- pnpm or npm
- MongoDB running (local or remote)

### 2. Clone & Install
```bash
git clone https://github.com/Sato-Isolated/uploadhaven.git
cd uploadhaven
pnpm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:
```env
MONGODB_URI=mongodb://localhost:27017/uploadhaven
AUTH_SECRET=your-random-secret-here
```

### 4. Start Development
```bash
pnpm dev
```

Visit `http://localhost:3000` - you're ready! 🎉

## 📝 First Steps

### Upload Your First File
1. Open UploadHaven in your browser
2. Drag & drop a file or click to browse
3. Copy the generated share link
4. Share with others!

### Basic Features
- **Drag & Drop**: Easy file uploads
- **Expiring Links**: Set TTL for automatic deletion
- **Real-time Updates**: See upload progress instantly
- **File Management**: View your uploaded files

## 🔧 Basic Configuration

### File Upload Settings
```env
MAX_FILE_SIZE=50MB                    # Maximum file size
UPLOAD_DIR=./public/uploads           # Storage directory
```

### Security Options
```env
ENABLE_MALWARE_SCANNING=true         # Enable virus scanning
RATE_LIMIT_REQUESTS=100              # Requests per minute
```

## 📱 Usage Examples

### Upload via Web Interface
1. Visit the homepage
2. Drag files to the upload area
3. Set expiration time (optional)
4. Get shareable link

### Upload via API
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@example.txt" \
  -F "expiresIn=24h"
```

### Share Files
Generated links work immediately:
```
http://localhost:3000/s/abc123
```

## 🔍 What's Next?

### For Users
- [File Management Guide](../features/file-management.md)
- [Sharing Options](../features/sharing.md)
- [Security Features](../features/security.md)

### For Developers
- [Development Setup](../development/setup.md)
- [API Documentation](../api/reference.md)
- [Contributing Guide](../development/contributing.md)

### For Administrators
- [Admin Dashboard](../admin/dashboard.md)
- [User Management](../admin/users.md)
- [System Configuration](../admin/configuration.md)

## 🆘 Need Help?

- **Issues**: Check [GitHub Issues](https://github.com/Sato-Isolated/uploadhaven/issues)
- **Documentation**: Browse the [full docs](../README.md)
- **Community**: Join discussions in [GitHub Discussions](https://github.com/Sato-Isolated/uploadhaven/discussions)

---

**Tip**: For detailed installation and configuration options, see the [Installation Guide](./installation.md).
