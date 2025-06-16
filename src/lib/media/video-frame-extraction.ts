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
 * Extract multiple frames from video for thumbnail selection
 */
export async function extractMultipleFrames(
  videoBuffer: Buffer,
  frameCount: number = 3
): Promise<Buffer[]> {
  if (!await isFFmpegAvailable()) {
    console.log('⚠️ FFmpeg not available, returning single placeholder');
    const placeholder = await generateVideoPlaceholder();
    return [placeholder];
  }

  const frames: Buffer[] = [];
  const tempId = Math.random().toString(36).substring(7);
  const inputPath = path.join(tmpdir(), `video_multi_${tempId}.tmp`);
  
  try {
    // Write video buffer to temporary file
    await writeFile(inputPath, videoBuffer);

    // Get video duration first
    const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv="p=0" "${inputPath}"`;
    const { stdout } = await execAsync(durationCommand);
    const duration = parseFloat(stdout.trim());
    
    if (!duration || duration <= 0) {
      console.log('⚠️ Could not determine video duration');
      return [await generateVideoPlaceholder()];
    }

    // Extract frames at evenly spaced intervals
    const outputPaths: string[] = [];
    for (let i = 0; i < frameCount; i++) {
      const timestamp = (duration * (i + 1)) / (frameCount + 1);
      const outputPath = path.join(tmpdir(), `frame_multi_${tempId}_${i}.jpg`);
      outputPaths.push(outputPath);

      const ffmpegCommand = [
        'ffmpeg',
        '-i', `"${inputPath}"`,
        '-ss', timestamp.toFixed(3),
        '-vframes', '1',
        '-q:v', '2',
        '-vf', 'scale=400:300:force_original_aspect_ratio=decrease:flags=lanczos',
        '-y',
        `"${outputPath}"`
      ].join(' ');

      try {
        await execAsync(ffmpegCommand);
        const frameBuffer = await readFile(outputPath);
        frames.push(frameBuffer);
      } catch (frameError) {
        console.error(`Failed to extract frame ${i}:`, frameError);
        // Add placeholder for failed frame
        frames.push(await generateVideoPlaceholder());
      }
    }

    // Clean up temporary files
    await cleanupTempFiles([inputPath, ...outputPaths]);

    return frames.length > 0 ? frames : [await generateVideoPlaceholder()];
  } catch (error) {
    console.error('❌ Multiple frame extraction failed:', error);
    await cleanupTempFiles([inputPath]);
    return [await generateVideoPlaceholder()];
  }
}

/**
 * Get video metadata for thumbnail generation
 */
export async function getVideoMetadata(videoBuffer: Buffer): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
} | null> {
  if (!await isFFmpegAvailable()) {
    return null;
  }

  const tempId = Math.random().toString(36).substring(7);
  const inputPath = path.join(tmpdir(), `video_meta_${tempId}.tmp`);

  try {
    await writeFile(inputPath, videoBuffer);

    const probeCommand = [
      'ffprobe',
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      `"${inputPath}"`
    ].join(' ');

    const { stdout } = await execAsync(probeCommand);
    const probeData = JSON.parse(stdout);

    // Find video stream
    const videoStream = probeData.streams?.find((s: any) => s.codec_type === 'video');
    
    if (!videoStream) {
      await cleanupTempFiles([inputPath]);
      return null;
    }

    const metadata = {
      duration: parseFloat(probeData.format?.duration || '0'),
      width: parseInt(videoStream.width || '0'),
      height: parseInt(videoStream.height || '0'),
      fps: eval(videoStream.r_frame_rate || '0'), // e.g., "30/1" -> 30
    };

    await cleanupTempFiles([inputPath]);
    return metadata;
  } catch (error) {
    console.error('Failed to get video metadata:', error);
    await cleanupTempFiles([inputPath]);
    return null;
  }
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

/**
 * Create animated thumbnail from multiple frames (GIF)
 */
export async function createAnimatedThumbnail(
  frames: Buffer[],
  outputSize: { width: number; height: number } = { width: 200, height: 150 }
): Promise<Buffer> {
  if (frames.length === 0) {
    return await generateVideoPlaceholder();
  }

  if (frames.length === 1) {
    // Single frame, just resize
    return await sharp(frames[0])
      .resize(outputSize.width, outputSize.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  try {
    // For multiple frames, create a grid layout
    const frameWidth = Math.floor(outputSize.width / Math.min(frames.length, 2));
    const frameHeight = Math.floor(outputSize.height / Math.ceil(frames.length / 2));

    // Resize all frames
    const resizedFrames = await Promise.all(
      frames.map(frame =>
        sharp(frame)
          .resize(frameWidth, frameHeight, { fit: 'cover' })
          .toBuffer()
      )
    );

    // Create composite image
    const canvas = sharp({
      create: {
        width: outputSize.width,
        height: outputSize.height,
        channels: 3,
        background: { r: 139, g: 92, b: 246 } // Purple background
      }
    });

    // Add frames to canvas
    const composite: any[] = [];
    resizedFrames.forEach((frame, index) => {
      const x = (index % 2) * frameWidth;
      const y = Math.floor(index / 2) * frameHeight;
      composite.push({ input: frame, top: y, left: x });
    });

    return await canvas
      .composite(composite)
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Failed to create animated thumbnail:', error);
    return await generateVideoPlaceholder();
  }
}
