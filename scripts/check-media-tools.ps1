#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check if media tools are properly installed and accessible
#>

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BinDir = Join-Path $ProjectRoot "tools/bin"

Write-Host "🔍 Checking media tools installation..." -ForegroundColor Cyan
Write-Host ""

# Check FFmpeg
$FFmpegPath = Join-Path $BinDir "ffmpeg.exe"
if (Test-Path $FFmpegPath) {
    Write-Host "✅ FFmpeg found at: $FFmpegPath" -ForegroundColor Green
    try {
        $ffmpegVersion = & $FFmpegPath -version 2>$null | Select-Object -First 1
        Write-Host "   Version: $ffmpegVersion" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️ FFmpeg found but not executable" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ FFmpeg not found" -ForegroundColor Red
    Write-Host "   Run: pnpm tools:install" -ForegroundColor Gray
}

Write-Host ""

# Check ImageMagick
$ConvertPath = Join-Path $BinDir "convert.exe"
if (Test-Path $ConvertPath) {
    Write-Host "✅ ImageMagick convert found at: $ConvertPath" -ForegroundColor Green
    try {
        $convertVersion = & $ConvertPath -version 2>$null | Select-Object -First 1
        Write-Host "   Version: $convertVersion" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️ Convert found but not executable" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ ImageMagick convert not found" -ForegroundColor Red
    Write-Host "   Run: pnpm tools:install" -ForegroundColor Gray
}

Write-Host ""

# Show PATH information
Write-Host "💡 To use these tools in your development environment:" -ForegroundColor Cyan
Write-Host "   1. Source the environment file: . .env.tools" -ForegroundColor Gray
Write-Host "   2. Or add tools/bin to your PATH manually" -ForegroundColor Gray
Write-Host "   3. Or reference them directly: ./tools/bin/ffmpeg.exe" -ForegroundColor Gray
