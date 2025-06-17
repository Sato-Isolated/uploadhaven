# File Sharing

Advanced file sharing capabilities and options in UploadHaven.

## 🔗 Overview

UploadHaven provides flexible and secure file sharing options for every use case, from simple link
sharing to advanced access controls.

---

## 🚀 Basic Sharing

### Instant Share Links

Every uploaded file automatically gets a secure share link:

```
https://uploadhaven.com/s/abc123xyz
```

#### Link Characteristics

- **Short & Clean**: Easy to share via any medium
- **Cryptographically Secure**: 128-bit entropy random IDs
- **Time-Limited**: Configurable expiration
- **Access Controlled**: Optional password protection

### Quick Share Actions

- **📋 Copy Link**: One-click copy to clipboard
- **📧 Email Share**: Direct email with link
- **📱 QR Code**: Generate QR code for mobile access
- **💬 Social Share**: Quick social media posting

---

## 🔒 Secure Sharing

### Password Protection

Add an extra layer of security to your shares:

#### Setting Passwords

1. **During Upload**: Set password at upload time
2. **Auto-Generate**: Let system create secure password
3. **After Upload**: Add password to existing files
4. **Change Password**: Update password anytime

#### Password Features

- **Strong Generation**: Cryptographically secure passwords
- **Custom Passwords**: Use your own memorable passwords
- **Password Hints**: Optional hints for recipients
- **Temporary Passwords**: Time-limited access codes

### Access Controls

#### Expiration Settings

- **1 Hour**: Quick temporary shares
- **24 Hours**: Default for most shares
- **7 Days**: Extended sharing
- **30 Days**: Long-term sharing
- **Never**: Permanent shares (requires account)

#### Download Limits

- **Single Use**: One-time download links
- **Limited Uses**: Set maximum download count
- **Unlimited**: No download restrictions
- **Time-Based**: Limit downloads per time period

---

## 📊 Share Analytics

### Access Tracking

Monitor how your shared files are being accessed:

#### View Statistics

- **Download Count**: Total number of downloads
- **Unique Visitors**: Number of unique access attempts
- **Access Times**: When files were accessed
- **Geographic Data**: General location of access (country level)
- **Referrer Information**: How users found your link

#### Real-Time Monitoring

- **Live Access Alerts**: Notifications when file is accessed
- **Download Notifications**: Email alerts on download
- **Suspicious Activity**: Alerts for unusual access patterns

---

## 🎯 Advanced Sharing

### Batch Sharing

Share multiple files efficiently:

#### Multi-File Links

- **Folder Sharing**: Share entire folder as single link
- **Archive Creation**: Automatic ZIP creation for multiple files
- **Selective Sharing**: Choose specific files from upload batch

#### Bulk Operations

- **Shared Expiration**: Set same expiration for multiple files
- **Bulk Password**: Apply same password to file group
- **Batch Notifications**: Single notification for multiple shares

### Custom Share Pages

Create branded sharing experiences:

#### Customization Options

- **Custom Descriptions**: Add context for recipients
- **File Previews**: Show previews when safe
- **Download Instructions**: Custom instructions for recipients
- **Branding**: Add your organization's branding (Pro feature)

---

## 📱 Mobile Sharing

### QR Code Generation

Perfect for mobile-to-mobile sharing:

#### QR Features

- **Instant Generation**: QR code created for every share link
- **High Resolution**: Suitable for printing or display
- **Custom Styling**: Branded QR codes (Pro feature)
- **Batch QR**: Generate QR codes for multiple files

### Mobile Optimization

- **Responsive Links**: Mobile-optimized download pages
- **Native App Integration**: Deep links to mobile apps
- **Touch-Friendly**: Large buttons and touch targets
- **Offline QR**: QR codes work without internet

---

## 🔧 Integration Options

### API Sharing

Programmatic sharing for developers:

```bash
# Generate share link via API
curl -X POST https://uploadhaven.com/api/share \
  -H "Authorization: Bearer your-token" \
  -d '{"fileId": "abc123", "expiresIn": "24h", "password": "secure123"}'
```

#### API Features

- **Bulk Share Creation**: Create multiple share links
- **Custom Parameters**: Set all sharing options via API
- **Webhook Notifications**: Get notified of share events
- **Access Analytics**: Retrieve sharing statistics

### Third-Party Integration

- **Slack Integration**: Share files directly in Slack
- **Discord Bots**: Share via Discord commands
- **Email Plugins**: Integration with email clients
- **Browser Extensions**: Quick sharing from any webpage

---

## 🛡️ Security Features

### Link Security

Multiple layers of protection:

#### Secure Generation

- **Cryptographic Randomness**: Impossible to guess links
- **No Sequential IDs**: Links don't reveal upload patterns
- **SSL/TLS Encryption**: All transfers encrypted
- **No Link Enumeration**: Links can't be systematically guessed

#### Access Protection

- **IP Restrictions**: Limit access to specific IP ranges (Pro)
- **Geographic Restrictions**: Block/allow specific countries
- **Time Windows**: Only allow access during specific hours
- **Device Limits**: Limit access to specific devices

### Privacy Protection

- **No Tracking Cookies**: Minimal tracking on share pages
- **Anonymous Access**: No account required for download
- **Metadata Stripping**: Remove identifying information
- **Secure Deletion**: Cryptographic deletion after expiration

---

## 📧 Notification System

### Share Notifications

Stay informed about your shared files:

#### Email Notifications

- **Share Confirmations**: Confirmation when share is created
- **Download Alerts**: Notification when file is downloaded
- **Expiration Warnings**: Reminders before file expires
- **Security Alerts**: Notifications of suspicious activity

#### Webhook Integration

- **Real-Time Events**: Instant notifications via webhooks
- **Custom Payloads**: Configure notification content
- **Retry Logic**: Reliable delivery with automatic retries
- **Event Filtering**: Choose which events to receive

---

## 📈 Usage Analytics

### Sharing Performance

Understand how your sharing is performing:

#### Metrics Dashboard

- **Total Shares Created**: Number of share links generated
- **Share Success Rate**: Percentage of successful downloads
- **Popular File Types**: Most shared content types
- **Peak Usage Times**: When sharing is most active

#### Optimization Insights

- **Link Performance**: Which links perform best
- **Sharing Patterns**: How users share your files
- **Geographic Distribution**: Where your content is accessed
- **Device Analytics**: Desktop vs mobile usage

---

## 🎨 Customization

### Share Page Theming

Customize the appearance of your share pages:

#### Visual Options

- **Custom Colors**: Match your brand colors
- **Logo Integration**: Add your organization logo
- **Custom Fonts**: Use your preferred typography
- **Background Images**: Custom background for share pages

#### Content Customization

- **Custom Messages**: Add personalized messages
- **Download Instructions**: Specific instructions for recipients
- **Terms of Use**: Custom terms for file access
- **Contact Information**: Your contact details

---

## 🔧 Troubleshooting

### Common Sharing Issues

#### Link Problems

- **Link Not Working**: Check expiration and password
- **Slow Downloads**: Check file size and network speed
- **Access Denied**: Verify password and access controls
- **Mobile Issues**: Ensure mobile optimization enabled

#### Security Concerns

- **Unwanted Access**: Review access logs and security settings
- **Link Leakage**: Consider password protection for sensitive files
- **Download Abuse**: Set download limits and monitoring
- **Privacy Issues**: Review privacy settings and metadata handling

### Best Practices

- **Password Strategy**: Use strong passwords for sensitive content
- **Expiration Management**: Set appropriate expiration times
- **Access Monitoring**: Regularly review access analytics
- **Security Updates**: Keep sharing settings updated

---

## 📚 Related Documentation

- **[File Management](file-management.md)** - Complete file management guide
- **[Security Features](security.md)** - Privacy and security details
- **[API Reference](../api/reference.md)** - Developer documentation
- **[Quick Start Guide](../getting-started/quick-start.md)** - Getting started
- **[Admin Dashboard](../admin/dashboard.md)** - Administrative controls
