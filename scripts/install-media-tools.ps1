#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Install FFmpeg and ImageMagick locally for UploadHaven development on Windows

.DESCRIPTION
    This script downloads and installs FFmpeg and ImageMagick binaries locally 
    in the project directory for development purposes. No admin rights required.

.EXAMPLE
    .\scripts\install-media-tools.ps1
#>

param(
    [switch]$Force,
    [switch]$SkipFFmpeg,
    [switch]$SkipImageMagick,
    [switch]$Help
)

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Definition -Detailed
    exit 0
}

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ToolsDir = Join-Path $ProjectRoot "tools"
$BinDir = Join-Path $ToolsDir "bin"

# URLs for latest stable versions
$FFmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$ImageMagickUrl = "https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-47-Q16-HDRI-x64-dll.exe"

Write-Host "🛠️  UploadHaven Media Tools Installer for Windows" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Create directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

# Function to download and extract/install
function Install-Tool {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExtractPath,
        [string]$ExecutableName
    )
    
    $IsExeInstaller = $Url.EndsWith(".exe")
    $DownloadFile = if ($IsExeInstaller) { 
        Join-Path $ToolsDir "$Name.exe" 
    } else { 
        Join-Path $ToolsDir "$Name.zip" 
    }
    $ExtractDir = Join-Path $ToolsDir $Name
    $FinalPath = Join-Path $BinDir $ExecutableName
    
    # Check if already installed
    if ((Test-Path $FinalPath) -and -not $Force) {
        Write-Host "✅ $Name already installed at: $FinalPath" -ForegroundColor Green
        return $true
    }
    
    try {
        Write-Host "⬇️  Downloading $Name..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $Url -OutFile $DownloadFile -UseBasicParsing
        
        if ($IsExeInstaller) {
            # Handle .exe installer (silent installation to temp directory)
            Write-Host "📦 Installing $Name silently..." -ForegroundColor Yellow
            
            # Create temporary installation directory
            $TempInstallDir = Join-Path $env:TEMP "ImageMagick_Install_$((Get-Random))"
            New-Item -ItemType Directory -Force -Path $TempInstallDir | Out-Null
            
            # Run silent installation
            $InstallArgs = @(
                "/VERYSILENT",
                "/NORESTART", 
                "/DIR=`"$TempInstallDir`"",
                "/COMPONENTS=",  # Install all components
                "/TASKS="       # No additional tasks
            )
            
            $Process = Start-Process -FilePath $DownloadFile -ArgumentList $InstallArgs -Wait -PassThru -NoNewWindow
            
            if ($Process.ExitCode -ne 0) {
                throw "Installation failed with exit code $($Process.ExitCode)"
            }
            
            # Find and copy required executables
            $ExeFiles = Get-ChildItem -Path $TempInstallDir -Recurse -Filter "*.exe" | Where-Object { 
                $_.Name -eq "convert.exe" -or $_.Name -eq "magick.exe" -or $_.Name -eq "identify.exe"
            }
            
            if ($ExeFiles.Count -eq 0) {
                throw "No executable files found in installation directory"
            }
              # Copy executables to bin directory
            foreach ($exe in $ExeFiles) {
                Copy-Item -Path $exe.FullName -Destination $BinDir -Force
                Write-Host "  ✓ Copied $($exe.Name)" -ForegroundColor Gray
            }
            
            # Create convert.exe alias for ImageMagick 7 compatibility
            $MagickPath = Join-Path $BinDir "magick.exe"
            $ConvertPath = Join-Path $BinDir "convert.exe"
            if ((Test-Path $MagickPath) -and -not (Test-Path $ConvertPath)) {
                # Create a batch file that calls magick.exe convert
                $BatchContent = "@echo off`r`n`"$MagickPath`" convert %*"
                $BatchPath = Join-Path $BinDir "convert.bat"
                Set-Content -Path $BatchPath -Value $BatchContent -Encoding ASCII
                
                # Create convert.exe as a copy of magick.exe for direct compatibility
                Copy-Item -Path $MagickPath -Destination $ConvertPath -Force
                Write-Host "  ✓ Created convert.exe alias" -ForegroundColor Gray
            }
            
            # Copy DLL files
            $DllFiles = Get-ChildItem -Path $TempInstallDir -Recurse -Filter "*.dll"
            foreach ($dll in $DllFiles) {
                Copy-Item -Path $dll.FullName -Destination $BinDir -Force -ErrorAction SilentlyContinue
            }
            
            # Cleanup
            Remove-Item -Path $DownloadFile -Force -ErrorAction SilentlyContinue
            Remove-Item -Path $TempInstallDir -Recurse -Force -ErrorAction SilentlyContinue
            
        } else {
            # Handle .zip archive
            Write-Host "📦 Extracting $Name..." -ForegroundColor Yellow
            Expand-Archive -Path $DownloadFile -DestinationPath $ExtractDir -Force
            
            # Find the executable in the extracted files
            $ExeFiles = Get-ChildItem -Path $ExtractDir -Recurse -Filter $ExecutableName
            if ($ExeFiles.Count -eq 0) {
                throw "$ExecutableName not found in extracted files"
            }
            
            # Copy executable to bin directory
            $SourceExe = $ExeFiles[0].FullName
            Copy-Item -Path $SourceExe -Destination $FinalPath -Force
            
            # Copy any required DLLs for the tool
            $ExeDir = Split-Path $SourceExe -Parent
            $DllFiles = Get-ChildItem -Path $ExeDir -Filter "*.dll" -ErrorAction SilentlyContinue
            foreach ($dll in $DllFiles) {
                Copy-Item -Path $dll.FullName -Destination $BinDir -Force
            }
            
            # Cleanup
            Remove-Item -Path $DownloadFile -Force -ErrorAction SilentlyContinue
            Remove-Item -Path $ExtractDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "✅ $Name installed successfully!" -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host "❌ Failed to install $Name`: $_" -ForegroundColor Red
        Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Install FFmpeg
if (-not $SkipFFmpeg) {
    Write-Host "🎥 Installing FFmpeg..." -ForegroundColor Cyan
    $ffmpegSuccess = Install-Tool -Name "ffmpeg" -Url $FFmpegUrl -ExtractPath "ffmpeg" -ExecutableName "ffmpeg.exe"
}

# Install ImageMagick
if (-not $SkipImageMagick) {
    Write-Host "🖼️  Installing ImageMagick..." -ForegroundColor Cyan
    $imageMagickSuccess = Install-Tool -Name "imagemagick" -Url $ImageMagickUrl -ExtractPath "imagemagick" -ExecutableName "convert.exe"
}

# Update package.json scripts to use local tools
Write-Host "📝 Updating package.json scripts..." -ForegroundColor Yellow

$PackageJsonPath = Join-Path $ProjectRoot "package.json"
if (Test-Path $PackageJsonPath) {
    try {
        $packageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
        
        # Add tools:install script if it doesn't exist
        if (-not $packageJson.scripts."tools:install") {
            $packageJson.scripts | Add-Member -NotePropertyName "tools:install" -NotePropertyValue "pwsh scripts/install-media-tools.ps1"
        }
        
        # Add tools:check script
        if (-not $packageJson.scripts."tools:check") {
            $packageJson.scripts | Add-Member -NotePropertyName "tools:check" -NotePropertyValue "pwsh scripts/check-media-tools.ps1"
        }
        
        # Save updated package.json
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content $PackageJsonPath -Encoding UTF8
        
        Write-Host "✅ Package.json updated with tool scripts" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not update package.json: $_" -ForegroundColor Yellow
    }
}

# Create environment configuration
Write-Host "⚙️  Creating environment configuration..." -ForegroundColor Yellow

$EnvPath = Join-Path $ProjectRoot ".env.tools"
$BinDirRelative = "tools/bin"

$envContent = @"
# Local Media Tools Configuration
# Add this to your .env file or source this file

# FFmpeg binary path (local installation)
FFMPEG_PATH=$BinDirRelative/ffmpeg.exe

# ImageMagick binary paths (local installation)  
IMAGEMAGICK_CONVERT_PATH=$BinDirRelative/convert.exe
IMAGEMAGICK_MAGICK_PATH=$BinDirRelative/magick.exe

# Add tools to PATH for this session
PATH=$BinDirRelative;$env:PATH
"@

Set-Content -Path $EnvPath -Value $envContent -Encoding UTF8

# Create a verification script
$CheckScriptPath = Join-Path (Join-Path $ProjectRoot "scripts") "check-media-tools.ps1"
$checkContent = @'
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
'@

Set-Content -Path $CheckScriptPath -Value $checkContent -Encoding UTF8

# Summary
Write-Host ""
Write-Host "🎉 Installation Summary" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

if (-not $SkipFFmpeg) {
    if ($ffmpegSuccess) {
        Write-Host "✅ FFmpeg installed successfully" -ForegroundColor Green
        Write-Host "   Location: $BinDir\ffmpeg.exe" -ForegroundColor Gray
    } else {
        Write-Host "❌ FFmpeg installation failed" -ForegroundColor Red
    }
}

if (-not $SkipImageMagick) {
    if ($imageMagickSuccess) {
        Write-Host "✅ ImageMagick installed successfully" -ForegroundColor Green
        Write-Host "   Location: $BinDir\convert.exe" -ForegroundColor Gray
    } else {
        Write-Host "❌ ImageMagick installation failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add to your .env file:" -ForegroundColor White
Write-Host "   FFMPEG_PATH=tools/bin/ffmpeg.exe" -ForegroundColor Gray
Write-Host "   IMAGEMAGICK_CONVERT_PATH=tools/bin/convert.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check installation:" -ForegroundColor White
Write-Host "   pnpm tools:check" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Enable thumbnail encryption:" -ForegroundColor White
Write-Host "   THUMBNAIL_ENCRYPTION_ENABLED=true" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Your local media tools are ready for development!" -ForegroundColor Green
