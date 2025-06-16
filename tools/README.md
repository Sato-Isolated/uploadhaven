# Media Tools Installation for Development

This directory contains scripts for installing FFmpeg and ImageMagick locally for development on Windows.

## 🚀 Quick Start

```bash
# Install both FFmpeg and ImageMagick locally
pnpm tools:install

# Check if tools are properly installed
pnpm tools:check
```

## 📋 What Gets Installed

### FFmpeg
- **Purpose**: Video thumbnail generation and frame extraction
- **Location**: `tools/bin/ffmpeg.exe`
- **Features**: Video processing, frame extraction, format conversion

### ImageMagick
- **Purpose**: PDF thumbnail generation and image processing
- **Location**: `tools/bin/convert.exe`, `tools/bin/magick.exe`
- **Features**: PDF page extraction, image manipulation, format conversion

## 🔧 Configuration

After installation, add these to your `.env` file:

```bash
# Enable thumbnail encryption with local tools
THUMBNAIL_ENCRYPTION_ENABLED=true
THUMBNAIL_CACHE_ENCRYPTED=true

# Optional: Specify tool paths explicitly
FFMPEG_PATH=tools/bin/ffmpeg.exe
IMAGEMAGICK_CONVERT_PATH=tools/bin/convert.exe
```

## 🎯 Usage Examples

### Automatic (Recommended)
The system automatically detects and uses local tools:

1. Upload any supported file
2. Thumbnail is automatically generated using appropriate tool
3. No manual intervention required

### Manual Tool Paths
You can also specify tool paths in environment variables:

```bash
# For FFmpeg
FFMPEG_PATH=C:/path/to/custom/ffmpeg.exe

# For ImageMagick
IMAGEMAGICK_CONVERT_PATH=C:/path/to/custom/convert.exe
```

## 🛠️ Advanced Options

### Install Only Specific Tools

```bash
# Install only FFmpeg
pwsh scripts/install-media-tools.ps1 -SkipImageMagick

# Install only ImageMagick
pwsh scripts/install-media-tools.ps1 -SkipFFmpeg

# Force reinstall (overwrite existing)
pwsh scripts/install-media-tools.ps1 -Force
```

### Custom Installation

If you prefer to install tools manually:

1. **FFmpeg**: Download from https://ffmpeg.org/download.html
2. **ImageMagick**: Download from https://imagemagick.org/script/download.php
3. Place executables in `tools/bin/` directory
4. Update environment variables accordingly

## 📂 Directory Structure

After installation:

```
tools/
├── bin/
│   ├── ffmpeg.exe          # Video processing
│   ├── convert.exe         # ImageMagick convert
│   ├── magick.exe          # ImageMagick main executable
│   └── *.dll               # Required DLL files
└── README.md               # This file
```

## 🔍 Troubleshooting

### Tools Not Found
```bash
# Check installation status
pnpm tools:check

# Reinstall tools
pnpm tools:install --Force
```

### Permission Issues
- Ensure you have write permissions to the project directory
- Try running PowerShell as administrator if needed

### Path Issues
- Verify tools are in `tools/bin/` directory
- Check environment variables are correctly set
- Use absolute paths if relative paths don't work

### Video Thumbnails Not Working
- Verify ffmpeg installation: `pnpm tools:check`
- Check video file format is supported
- Look for ffmpeg-related errors in logs

### PDF Thumbnails Not Working
- Verify ImageMagick installation: `pnpm tools:check`
- Check PDF file is not corrupted or password-protected
- Look for convert-related errors in logs

## 🌟 Benefits of Local Installation

- **No Admin Rights**: Install without system-wide changes
- **Version Control**: Specific versions for consistent behavior
- **Isolation**: Doesn't interfere with system installations
- **Portability**: Works across different development environments
- **Easy Cleanup**: Remove entire `tools/` directory to uninstall

## 📝 Notes

- Tools are downloaded from official sources
- Local installation doesn't affect system PATH
- Tools are automatically detected by the application
- Cache and temporary files are managed automatically

## 🔄 Updates

To update tools to newer versions:

```bash
# Force reinstall with latest versions
pnpm tools:install --Force
```

## 🗑️ Uninstall

To remove all local tools:

```bash
# Remove tools directory
Remove-Item -Recurse -Force tools/

# Remove from environment (optional)
# Delete FFMPEG_PATH and IMAGEMAGICK_CONVERT_PATH from .env
```
