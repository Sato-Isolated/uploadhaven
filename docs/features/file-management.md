# File Management

Comprehensive guide to managing your files in UploadHaven.

## 📁 Overview

UploadHaven provides intuitive file management capabilities for both users and administrators. This
guide covers uploading, organizing, sharing, and managing your files.

---

## 🚀 Uploading Files

### Web Interface Upload

#### Drag & Drop

1. **Simple Upload**: Drag files directly to the upload area
2. **Batch Upload**: Select multiple files at once
3. **Folder Upload**: Drag entire folders (preserves structure)

#### Click to Browse

1. Click the upload area
2. Select files from your system
3. Confirm upload settings

#### Upload Options

- **Expiration Time**: Set automatic deletion (1h, 24h, 7d, 30d, never)
- **Password Protection**: Add optional password
- **Auto-generate Password**: Let system create secure password
- **File Description**: Add optional description

### API Upload

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf" \
  -F "expiresIn=24h" \
  -F "password=optional-password"
```

---

## 📋 File Dashboard

### Your Files Overview

Access your uploaded files through the dashboard:

#### File Information

- **Filename**: Original file name
- **Size**: File size in human-readable format
- **Upload Date**: When the file was uploaded
- **Expiration**: When the file will be deleted
- **Download Count**: Number of times downloaded
- **Share Link**: Quick copy of share URL

#### File Actions

- **📋 Copy Link**: Copy share URL to clipboard
- **👁️ Preview**: View file content (images, text, PDFs)
- **⬇️ Download**: Download the file
- **🔗 Share**: Access sharing options
- **🗑️ Delete**: Remove file immediately
- **⏰ Extend**: Change expiration time

---

## 🔗 Sharing Files

### Share Links

Every uploaded file gets a unique, secure share link:

```
https://uploadhaven.com/s/abc123xyz
```

#### Link Features

- **Short & Memorable**: Easy to share via any medium
- **Secure**: Cryptographically secure random IDs
- **Time-Limited**: Automatic expiration
- **Password Protected**: Optional password requirement

### Sharing Options

#### Public Sharing

- Share link directly
- QR code generation
- Email sharing
- Social media integration

#### Private Sharing

- Password-protected links
- Expiration time limits
- Download limits
- Access tracking

---

## 🔍 File Search & Organization

### Search Files

Find your files quickly:

- **By Name**: Search filenames
- **By Type**: Filter by file type
- **By Date**: Filter by upload date
- **By Size**: Filter by file size

### File Categories

Files are automatically categorized:

- **📄 Documents**: PDFs, Word docs, spreadsheets
- **🖼️ Images**: Photos, graphics, screenshots
- **🎵 Audio**: Music, recordings, podcasts
- **🎬 Video**: Movies, clips, recordings
- **💾 Archives**: ZIP, RAR, compressed files
- **💻 Code**: Source code, scripts, configs

---

## 🛡️ File Security

### Encryption

- **At Rest**: All files encrypted on disk
- **In Transit**: HTTPS for all transfers
- **Keys**: Unique encryption key per file

### Privacy Features

- **Anonymous Upload**: No account required
- **Automatic Deletion**: Files auto-delete on expiration
- **No Tracking**: Minimal metadata stored
- **Secure Sharing**: Cryptographically secure links

### Malware Protection

- **Automatic Scanning**: All files scanned on upload
- **VirusTotal Integration**: Multi-engine threat detection
- **Quarantine**: Suspicious files isolated
- **Real-time Updates**: Latest threat definitions

---

## ⚙️ File Settings

### Default Settings

Configure your default upload preferences:

- **Default Expiration**: Set preferred expiration time
- **Auto-Password**: Enable automatic password generation
- **Upload Notifications**: Email confirmations
- **Download Notifications**: Alert on file access

### Advanced Options

- **Compression**: Enable automatic compression for text files
- **Thumbnail Generation**: Create previews for images/videos
- **Metadata Preservation**: Keep or strip file metadata
- **Bandwidth Limiting**: Control upload/download speeds

---

## 📊 File Analytics

### Usage Statistics

Track your file usage:

- **Upload Count**: Total files uploaded
- **Storage Used**: Total space consumed
- **Download Stats**: File access patterns
- **Popular Files**: Most downloaded content

### Performance Metrics

- **Upload Speed**: Average upload performance
- **Processing Time**: File processing duration
- **Storage Efficiency**: Compression ratios
- **Access Patterns**: Download timing

---

## 🗑️ File Cleanup

### Automatic Cleanup

- **Expiration**: Files auto-delete based on TTL
- **Storage Limits**: Oldest files removed when limit reached
- **Inactive Files**: Remove unused files after period

### Manual Cleanup

- **Bulk Delete**: Select multiple files for deletion
- **Filter & Delete**: Delete by criteria (date, size, type)
- **Archive Old Files**: Move old files to archive storage

---

## 🔧 Troubleshooting

### Common Issues

#### Upload Problems

- **File Too Large**: Check size limits (default 50MB)
- **Unsupported Format**: Verify file type allowed
- **Network Issues**: Check internet connection
- **Browser Issues**: Try different browser or clear cache

#### Access Problems

- **Link Expired**: File may have reached expiration
- **Password Required**: Check if password protection enabled
- **File Not Found**: Verify link accuracy
- **Download Issues**: Check browser download settings

#### Performance Issues

- **Slow Upload**: Check network speed and file size
- **Processing Delays**: Large files take longer to process
- **Preview Issues**: Some file types don't support preview

### Getting Help

- **Documentation**: Check relevant guides
- **API Reference**: For technical integration
- **Community**: Join our discussion forums
- **Support**: Contact support for urgent issues

---

## 📚 Related Documentation

- **[Quick Start Guide](../getting-started/quick-start.md)** - Get started quickly
- **[Sharing Options](sharing.md)** - Advanced sharing features
- **[Security Features](security.md)** - Privacy and security
- **[API Reference](../api/reference.md)** - Developer documentation
- **[Admin Dashboard](../admin/dashboard.md)** - Administrative tools
