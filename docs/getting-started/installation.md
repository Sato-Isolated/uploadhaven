# Installation Guide

This guide will help you set up UploadHaven locally for development or production.

## Prerequisites

- **Node.js** 18.17 or later
- **pnpm** (recommended) or npm
- **MongoDB** 4.4 or later
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sato-Isolated/uploadhaven.git
cd uploadhaven
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/uploadhaven

# Authentication
AUTH_SECRET=your-secret-key-here

# Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./public/uploads

# Security (Optional)
ENABLE_MALWARE_SCANNING=false
VIRUSTOTAL_API_KEY=your-api-key
```

### 4. Database Setup

Make sure MongoDB is running locally or provide a connection string to a remote instance.

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Production Deployment

### Docker (Recommended)

```bash
# Build the Docker image
docker build -t uploadhaven .

# Run with Docker Compose
docker-compose up -d
```

### Manual Deployment

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | - | ✅ |
| `AUTH_SECRET` | Secret key for authentication | - | ✅ |
| `MAX_FILE_SIZE` | Maximum file size for uploads | 50MB | ❌ |
| `UPLOAD_DIR` | Directory for file storage | ./public/uploads | ❌ |
| `ENABLE_MALWARE_SCANNING` | Enable virus scanning | false | ❌ |
| `VIRUSTOTAL_API_KEY` | VirusTotal API key | - | ❌ |

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Ensure MongoDB is running
- Check connection string format
- Verify network connectivity

**File Upload Errors**
- Check upload directory permissions
- Verify file size limits
- Review server logs for details

**Authentication Issues**
- Regenerate AUTH_SECRET
- Clear browser cookies
- Check environment variables

## Next Steps

- [Quick Start Guide](./quick-start.md)
- [Development Setup](../development/setup.md)
- [API Reference](../api/reference.md)
