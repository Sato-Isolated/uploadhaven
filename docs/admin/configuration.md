# System Configuration

Detailed configuration guide for UploadHaven administrators.

## ⚙️ Overview

This guide covers all configuration options available in UploadHaven, from basic settings to
advanced performance tuning.

---

## 🚀 Basic Configuration

### Environment Variables

#### Required Settings

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/uploadhaven
AUTH_SECRET=your-secret-key-here

# Basic Upload Settings
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./public/uploads
```

#### Optional Settings

```env
# Security Settings
ENABLE_MALWARE_SCANNING=true
VIRUSTOTAL_API_KEY=your-api-key
RATE_LIMIT_REQUESTS=100

# Feature Flags
ENABLE_USER_REGISTRATION=true
ENABLE_ANONYMOUS_UPLOAD=true
ENABLE_FILE_PREVIEW=true
```

### Application Settings

#### Upload Configuration

- **Maximum File Size**: Global upload size limit
- **Allowed File Types**: Permitted file extensions
- **Upload Directory**: File storage location
- **Temporary Directory**: Processing file location

#### Expiration Settings

- **Default TTL**: Standard file expiration time
- **Maximum TTL**: Longest allowed expiration
- **Minimum TTL**: Shortest allowed expiration
- **Cleanup Frequency**: How often to remove expired files

---

## 🛡️ Security Configuration

### Authentication Settings

#### Session Configuration

```env
# Session Settings
SESSION_TIMEOUT=24h
SESSION_SECURE=true
SESSION_SAME_SITE=strict
```

#### Password Policies

```env
# Password Requirements
MIN_PASSWORD_LENGTH=8
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_NUMBERS=true
REQUIRE_SYMBOLS=true
```

### Rate Limiting

#### API Rate Limits

```env
# Rate Limiting
RATE_LIMIT_WINDOW=60000    # 1 minute
RATE_LIMIT_MAX=100         # 100 requests per minute
RATE_LIMIT_SKIP_SUCCESS=false
```

#### Upload Rate Limits

```env
# Upload Limits
UPLOAD_RATE_LIMIT=10       # 10 uploads per minute
UPLOAD_SIZE_LIMIT=50MB     # Maximum file size
CONCURRENT_UPLOADS=3       # Simultaneous uploads per user
```

### Malware Scanning

#### VirusTotal Configuration

```env
# VirusTotal Settings
VIRUSTOTAL_API_KEY=your_api_key
VIRUSTOTAL_REQUESTS_PER_MINUTE=4
VIRUSTOTAL_QUOTA_LIMIT=1000
VIRUSTOTAL_TIMEOUT=30000
```

#### ClamAV Configuration

```env
# ClamAV Settings (if using local scanning)
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
CLAMAV_TIMEOUT=10000
```

---

## 💾 Database Configuration

### MongoDB Settings

#### Connection Configuration

```env
# MongoDB Connection
MONGODB_URI=mongodb://username:password@host:port/database
MONGODB_MAX_POOL_SIZE=10
MONGODB_CONNECT_TIMEOUT=10000
MONGODB_SOCKET_TIMEOUT=10000
```

#### Performance Tuning

```javascript
// MongoDB connection options
{
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  useNewUrlParser: true,
  useUnifiedTopology: true
}
```

### Database Indexes

#### Required Indexes

```javascript
// File collection indexes
db.files.createIndex({ shortUrl: 1 }, { unique: true });
db.files.createIndex({ expiresAt: 1 });
db.files.createIndex({ userId: 1 });
db.files.createIndex({ uploadDate: -1 });

// User collection indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
```

---

## 🗄️ Storage Configuration

### Local Storage

#### File System Settings

```env
# Local Storage Configuration
UPLOAD_DIR=./public/uploads
TEMP_DIR=./tmp
PROTECTED_DIR=./public/uploads/protected
PUBLIC_DIR=./public/uploads/public
```

#### Directory Structure

```
uploads/
├── public/          # Public files
├── protected/       # Password-protected files
├── thumbnails/      # Generated thumbnails
└── temp/           # Temporary processing files
```

### Cloud Storage (S3 Compatible)

#### AWS S3 Configuration

```env
# AWS S3 Settings
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=uploadhaven-files
S3_ENDPOINT=https://s3.amazonaws.com
```

#### MinIO Configuration

```env
# MinIO Settings
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploadhaven
MINIO_USE_SSL=false
```

---

## 🎨 Frontend Configuration

### UI Settings

#### Branding Configuration

```env
# Branding Settings
SITE_NAME=UploadHaven
SITE_DESCRIPTION=Simple, secure file sharing
SITE_URL=https://uploadhaven.com
LOGO_URL=/logo.png
```

#### Theme Configuration

```env
# Theme Settings
DEFAULT_THEME=light
ENABLE_DARK_MODE=true
CUSTOM_CSS_URL=/custom.css
```

### Feature Flags

#### Available Features

```env
# Feature Toggles
ENABLE_USER_REGISTRATION=true
ENABLE_ANONYMOUS_UPLOAD=true
ENABLE_FILE_PREVIEW=true
ENABLE_DOWNLOAD_ANALYTICS=true
ENABLE_QR_CODES=true
ENABLE_SOCIAL_SHARING=true
```

---

## 📧 Email Configuration

### SMTP Settings

#### Basic SMTP Configuration

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Advanced SMTP Settings

```env
# Advanced SMTP
SMTP_TLS_REJECT_UNAUTHORIZED=true
SMTP_POOL=true
SMTP_MAX_CONNECTIONS=5
SMTP_MAX_MESSAGES=100
```

### Email Templates

#### Notification Templates

- **Upload Confirmation**: File upload success notification
- **Download Alert**: File download notification
- **Expiration Warning**: File expiration reminder
- **Security Alert**: Suspicious activity notification

---

## 🔧 Performance Configuration

### Caching Settings

#### Redis Configuration

```env
# Redis Settings
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_PREFIX=uploadhaven:
```

#### Cache Configuration

```env
# Cache Settings
CACHE_TTL=3600             # 1 hour default TTL
CACHE_MAX_SIZE=1000        # Maximum cache entries
CACHE_ENABLE_COMPRESSION=true
```

### Processing Settings

#### File Processing

```env
# Processing Configuration
MAX_CONCURRENT_UPLOADS=10
THUMBNAIL_GENERATION=true
THUMBNAIL_SIZES=150,300,600
COMPRESSION_ENABLED=true
COMPRESSION_QUALITY=80
```

#### Background Jobs

```env
# Job Queue Settings
QUEUE_CONCURRENCY=5
QUEUE_MAX_RETRY=3
QUEUE_RETRY_DELAY=5000
CLEANUP_INTERVAL=3600000   # 1 hour
```

---

## 🌐 Network Configuration

### CORS Settings

#### CORS Configuration

```env
# CORS Settings
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
CORS_HEADERS=Content-Type,Authorization
CORS_CREDENTIALS=true
```

### Proxy Settings

#### Reverse Proxy Configuration

```nginx
# Nginx configuration example
server {
    listen 80;
    server_name uploadhaven.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔐 SSL/TLS Configuration

### Certificate Management

#### Let's Encrypt Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d uploadhaven.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

#### Custom Certificate

```env
# SSL Configuration
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
SSL_CA_PATH=/path/to/ca-bundle.crt
```

---

## 📊 Monitoring Configuration

### Logging Settings

#### Log Configuration

```env
# Logging Settings
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/uploadhaven/app.log
LOG_MAX_SIZE=10MB
LOG_MAX_FILES=5
```

#### Log Categories

- **Access Logs**: HTTP request logging
- **Error Logs**: Application error logging
- **Security Logs**: Security event logging
- **Performance Logs**: Performance metric logging

### Metrics Collection

#### Prometheus Configuration

```env
# Metrics Settings
ENABLE_METRICS=true
METRICS_PORT=9090
METRICS_PATH=/metrics
METRICS_INTERVAL=10000
```

---

## 🔧 Advanced Configuration

### Clustering Settings

#### Load Balancing

```env
# Cluster Configuration
CLUSTER_MODE=true
CLUSTER_WORKERS=4
CLUSTER_RESTART_DELAY=5000
```

### Custom Middleware

#### Security Headers

```javascript
// Security headers configuration
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}
```

---

## 📚 Related Documentation

- **[Installation Guide](../getting-started/installation.md)** - Initial setup
- **[Admin Dashboard](dashboard.md)** - Administrative interface
- **[Security Features](../features/security.md)** - Security implementation
- **[Performance Optimization](../features/performance-optimizations.md)** - Performance tuning
- **[Troubleshooting](troubleshooting.md)** - Problem resolution
