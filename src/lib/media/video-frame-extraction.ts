/**
 * Video Frame Extraction for Encrypted Thumbnails
 *
 * Provides secure video frame extraction for generating encrypted thumbnails.
 * Uses ffmpeg when available, falls back to placeholders otherwise.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import sharp from 'sharp';

const execAsync = promisify(exec);

export interface VideoFrameConfig {
  timestamp: string; // Time to extract frame (e.g., '00:00:01.000')
  quality: number; // JPEG quality for extraction
  maxWidth: number;
  maxHeight: number;
}

const DEFAULT_VIDEO_CONFIG: VideoFrameConfig = {
  timestamp: '00:00:01.000', // Extract frame at 1 second
  quality: 90,
  maxWidth: 1920,
  maxHeight: 1080,
};

/**
 * Check if ffmpeg is available on the system
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    // Check for local installation first
    const localFFmpegPath = path.join(process.cwd(), 'tools', 'bin', 'ffmpeg.exe');
    try {
      const fs = await import('fs');
      if (fs.existsSync(localFFmpegPath)) {
        console.log('🎥 Using local ffmpeg installation');
        return true;
      }
    } catch {}

    // Check environment variable
    const envFFmpegPath = process.env.FFMPEG_PATH;
    if (envFFmpegPath) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(envFFmpegPath)) {
          console.log('🎥 Using ffmpeg from environment variable');
          return true;
        }
      } catch {}
    }

    // Check system PATH
    await execAsync('ffmpeg -version');
    console.log('🎥 Using system ffmpeg installation');
    return true;
  } catch {
    console.log('⚠️ ffmpeg not available - video thumbnails will use placeholders');
    return false;
  }
}

/**
 * Get the ffmpeg executable path
 */
function getFFmpegPath(): string {
  // Priority: local installation > environment variable > system PATH
  const localPath = path.join(process.cwd(), 'tools', 'bin', 'ffmpeg.exe');
  try {
    const fs = require('fs');
    if (process.platform === 'win32' && fs.existsSync(localPath)) {
      return localPath;
    }
  } catch {}
  
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

/**
 * Extract frame from video buffer using ffmpeg
 */
export async function extractVideoFrame(
  videoBuffer: Buffer,
  config: Partial<VideoFrameConfig> = {}
): Promise<Buffer> {
  const finalConfig = { ...DEFAULT_VIDEO_CONFIG, ...config };
  
  // Check if ffmpeg is available
  const ffmpegAvailable = await isFFmpegAvailable();
  if (!ffmpegAvailable) {
    console.log('⚠️ FFmpeg not available, using placeholder for video thumbnail');
    return await generateVideoPlaceholder();
  }

  // Generate temporary file paths
  const tempId = Math.random().toString(36).substring(7);
  const inputPath = path.join(tmpdir(), `video_input_${tempId}.tmp`);
  const outputPath = path.join(tmpdir(), `frame_output_${tempId}.jpg`);

  try {
    console.log('🎬 Extracting video frame with ffmpeg...');
    
    // Write video buffer to temporary file
    await writeFile(inputPath, videoBuffer);    // Extract frame using ffmpeg
    const ffmpegPath = getFFmpegPath();
    const ffmpegCommand = [
      `"${ffmpegPath}"`,
      '-i', `"${inputPath}"`,
      '-ss', finalConfig.timestamp,
      '-vframes', '1',
      '-q:v', finalConfig.quality.toString(),
      '-vf', `scale='min(${finalConfig.maxWidth},iw)':'min(${finalConfig.maxHeight},ih)':force_original_aspect_ratio=decrease`,
      '-y', // Overwrite output file
      `"${outputPath}"`
    ].join(' ');

    console.log('🔧 Running ffmpeg command:', ffmpegCommand);
    await execAsync(ffmpegCommand);

    // Read extracted frame
    const frameBuffer = await readFile(outputPath);
    console.log(`✅ Video frame extracted: ${frameBuffer.length} bytes`);

    // Clean up temporary files
    await cleanupTempFiles([inputPath, outputPath]);

    return frameBuffer;
  } catch (error) {
    console.error('❌ Video frame extraction failed:', error);
    
    // Clean up temporary files on error
    await cleanupTempFiles([inputPath, outputPath]);
    
    // Fall back to placeholder
    return await generateVideoPlaceholder();
  }
}

/**
 * Generate video placeholder thumbnail
 */
async function generateVideoPlaceholder(): Promise<Buffer> {
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="videoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#5B21B6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#videoGrad)" rx="12"/>
      
      <!-- Play button circle -->
      <circle cx="200" cy="150" r="40" fill="rgba(255,255,255,0.9)"/>
      
      <!-- Play triangle -->
      <polygon points="185,135 185,165 215,150" fill="#8B5CF6"/>
      
      <!-- Video icon text -->
      <text x="200" y="220" font-family="Arial, sans-serif" font-size="16" 
            text-anchor="middle" fill="white" font-weight="bold">
        Video Preview
      </text>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toBuffer();
}





/**
 * Clean up temporary files
 */
async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  await Promise.allSettled(
    filePaths.map(async (filePath) => {
      try {
        await unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }
    })
  );
}


