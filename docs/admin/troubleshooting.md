# Troubleshooting Guide

Common issues and solutions for UploadHaven administrators.

## 🚨 Common Issues

### Installation Problems

#### Database Connection Issues

**Problem**: Cannot connect to MongoDB

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions**:

1. **Check MongoDB Status**:

   ```bash
   sudo systemctl status mongod
   sudo systemctl start mongod
   ```

2. **Verify Connection String**:

   ```env
   MONGODB_URI=mongodb://localhost:27017/uploadhaven
   ```

3. **Check Firewall**:
   ```bash
   sudo ufw allow 27017
   ```

#### Environment Variables

**Problem**: Missing or incorrect environment variables

**Solutions**:

1. **Copy Template**:

   ```bash
   cp .env.example .env.local
   ```

2. **Required Variables**:

   ```env
   MONGODB_URI=mongodb://localhost:27017/uploadhaven
   AUTH_SECRET=your-secret-key-here
   ```

3. **Restart Application**:
   ```bash
   pnpm dev
   ```

### Upload Issues

#### File Size Limits

**Problem**: Files failing to upload with 413 error

**Solutions**:

1. **Check Environment Variable**:

   ```env
   MAX_FILE_SIZE=50MB
   ```

2. **Nginx Configuration**:

   ```nginx
   client_max_body_size 100M;
   ```

3. **Node.js Memory**:
   ```bash
   node --max-old-space-size=4096 server.js
   ```

#### Storage Space

**Problem**: Disk space full

**Solutions**:

1. **Check Disk Usage**:

   ```bash
   df -h
   du -sh ./public/uploads
   ```

2. **Clean Expired Files**:

   ```bash
   pnpm run cleanup
   ```

3. **Configure Cleanup**:
   ```env
   CLEANUP_INTERVAL=3600000  # 1 hour
   ```

### Performance Issues

#### Slow Upload/Download

**Problem**: Poor transfer speeds

**Solutions**:

1. **Check Network**:

   ```bash
   ping your-domain.com
   curl -w "@curl-format.txt" -o /dev/null -s "http://your-domain.com"
   ```

2. **Enable Compression**:

   ```env
   COMPRESSION_ENABLED=true
   ```

3. **Optimize Database**:
   ```javascript
   db.files.createIndex({ expiresAt: 1 });
   db.files.createIndex({ shortUrl: 1 });
   ```

#### High Memory Usage

**Problem**: Application consuming too much memory

**Solutions**:

1. **Monitor Memory**:

   ```bash
   htop
   free -h
   ```

2. **Tune Garbage Collection**:

   ```bash
   node --max-old-space-size=2048 --gc-interval=100 server.js
   ```

3. **Enable Streaming**:
   ```env
   ENABLE_STREAMING=true
   STREAM_THRESHOLD=10MB
   ```

### Security Issues

#### Malware Scanner Not Working

**Problem**: VirusTotal API errors

**Solutions**:

1. **Check API Key**:

   ```env
   VIRUSTOTAL_API_KEY=your_actual_api_key
   ```

2. **Verify Quota**:

   ```bash
   curl -H "x-apikey: YOUR_API_KEY" https://www.virustotal.com/api/v3/users/YOUR_API_KEY/overall_quotas
   ```

3. **Fallback Scanner**:
   ```env
   ENABLE_CLAMAV=true
   CLAMAV_HOST=localhost
   CLAMAV_PORT=3310
   ```

#### Rate Limiting Issues

**Problem**: Legitimate users getting blocked

**Solutions**:

1. **Adjust Limits**:

   ```env
   RATE_LIMIT_REQUESTS=200
   RATE_LIMIT_WINDOW=60000
   ```

2. **Whitelist IPs**:

   ```env
   RATE_LIMIT_WHITELIST=192.168.1.0/24,10.0.0.0/8
   ```

3. **Monitor Logs**:
   ```bash
   tail -f /var/log/uploadhaven/rate-limit.log
   ```

### Authentication Problems

#### Session Issues

**Problem**: Users getting logged out frequently

**Solutions**:

1. **Check Session Settings**:

   ```env
   SESSION_TIMEOUT=24h
   SESSION_SECURE=true
   ```

2. **Redis Connection**:

   ```env
   REDIS_URL=redis://localhost:6379
   ```

3. **Clear Sessions**:
   ```bash
   redis-cli FLUSHDB
   ```

#### Email Verification

**Problem**: Verification emails not sending

**Solutions**:

1. **SMTP Configuration**:

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

2. **Test Email**:

   ```bash
   pnpm run test:email
   ```

3. **Check Spam Folder**: Verify emails aren't being filtered

## 🔧 Diagnostic Tools

### Health Check Script

```bash
#!/bin/bash
echo "UploadHaven Health Check"
echo "======================="

# Check MongoDB
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB: Connected"
else
    echo "❌ MongoDB: Connection failed"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Connected"
else
    echo "❌ Redis: Connection failed"
fi

# Check Disk Space
DISK_USAGE=$(df -h | grep -E "/$" | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "✅ Disk: ${DISK_USAGE}% used"
else
    echo "⚠️ Disk: ${DISK_USAGE}% used (Warning: >80%)"
fi

# Check Application
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application: Running"
else
    echo "❌ Application: Not responding"
fi
```

### Log Analysis

```bash
# View error logs
tail -f /var/log/uploadhaven/error.log

# Search for specific errors
grep "ERROR" /var/log/uploadhaven/app.log | tail -20

# Monitor API responses
tail -f /var/log/uploadhaven/access.log | grep "POST /api/upload"

# Database query performance
mongosh --eval "db.setProfilingLevel(2, { slowms: 100 })"
```

### Performance Monitoring

```bash
# CPU and Memory usage
htop

# Network monitoring
iftop

# Disk I/O
iotop

# Application metrics
curl http://localhost:3000/metrics
```

## 🛠️ Maintenance Scripts

### Database Maintenance

```javascript
// Remove expired files
db.files.deleteMany({
  expiresAt: { $lte: new Date() },
});

// Rebuild indexes
db.files.reIndex();

// Database statistics
db.files.stats();
```

### File System Cleanup

```bash
#!/bin/bash
# Clean up orphaned files
find ./public/uploads -type f -mtime +30 -delete

# Clean temporary files
rm -rf ./tmp/*

# Compress old logs
gzip /var/log/uploadhaven/*.log.1
```

### Performance Optimization

```bash
# Optimize images
find ./public/uploads -name "*.jpg" -exec jpegoptim --max=85 {} \;

# Generate thumbnails in batch
pnpm run generate:thumbnails

# Update search indexes
pnpm run index:rebuild
```

## 📞 Getting Help

### Support Channels

- **Documentation**: Check relevant guides first
- **GitHub Issues**: Report bugs and feature requests
- **Community Forum**: Ask questions and share solutions
- **Email Support**: For critical production issues

### When Reporting Issues

Include the following information:

1. **System Information**: OS, Node.js version, MongoDB version
2. **Error Messages**: Complete error logs
3. **Steps to Reproduce**: Detailed reproduction steps
4. **Configuration**: Relevant environment variables (redacted)
5. **Logs**: Recent application logs

### Emergency Contacts

For production emergencies:

- **System Administrator**: admin@uploadhaven.com
- **Technical Support**: support@uploadhaven.com
- **On-Call Engineer**: +1-555-UPLOAD (urgent only)

## 📚 Related Documentation

- **[Admin Dashboard](dashboard.md)** - Administrative interface
- **[System Configuration](configuration.md)** - Configuration guide
- **[Installation Guide](../getting-started/installation.md)** - Setup instructions
- **[Security Features](../features/security.md)** - Security implementation
- **[Performance Optimization](../features/performance-optimizations.md)** - Performance tuning
