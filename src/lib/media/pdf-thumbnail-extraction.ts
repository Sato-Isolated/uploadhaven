/**
 * PDF Thumbnail Generation for Encrypted Previews
 *
 * Provides secure PDF page extraction for generating encrypted thumbnails.
 * Uses pdf2pic when available, falls back to placeholders otherwise.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, access } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import sharp from 'sharp';

const execAsync = promisify(exec);

export interface PDFThumbnailConfig {
  pageNumber: number; // Page to extract (1-indexed)
  density: number; // DPI for extraction
  quality: number; // JPEG quality
  maxWidth: number;
  maxHeight: number;
}

const DEFAULT_PDF_CONFIG: PDFThumbnailConfig = {
  pageNumber: 1, // First page
  density: 150, // 150 DPI
  quality: 90,
  maxWidth: 800,
  maxHeight: 1000,
};

/**
 * Check if ImageMagick/GraphicsMagick is available for PDF processing
 */
export async function isPDFToolAvailable(): Promise<{ tool: string; available: boolean }> {
  // Check for local ImageMagick v7 installation first (magick.exe)
  const localMagickPath = path.join(process.cwd(), 'tools', 'bin', 'magick.exe');
  try {
    const fs = await import('fs');
    if (fs.existsSync(localMagickPath)) {
      console.log('🖼️ Using local ImageMagick v7 installation (magick)');
      return { tool: 'imagemagick7-local', available: true };
    }
  } catch {}

  // Check for local ImageMagick legacy installation (convert.exe)
  const localConvertPath = path.join(process.cwd(), 'tools', 'bin', 'convert.exe');
  try {
    const fs = await import('fs');
    if (fs.existsSync(localConvertPath)) {
      console.log('🖼️ Using local ImageMagick legacy installation (convert)');
      return { tool: 'imagemagick-local', available: true };
    }
  } catch {}

  // Check environment variable for magick
  const envMagickPath = process.env.IMAGEMAGICK_MAGICK_PATH;
  if (envMagickPath) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(envMagickPath)) {
        console.log('🖼️ Using ImageMagick v7 from environment variable');
        return { tool: 'imagemagick7-env', available: true };
      }
    } catch {}
  }

  // Check environment variable for convert
  const envConvertPath = process.env.IMAGEMAGICK_CONVERT_PATH;
  if (envConvertPath) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(envConvertPath)) {
        console.log('🖼️ Using ImageMagick from environment variable');
        return { tool: 'imagemagick-env', available: true };
      }
    } catch {}
  }

  // Try system ImageMagick v7 first (magick command)
  try {
    await execAsync('magick -version');
    console.log('🖼️ Using system ImageMagick v7 installation');
    return { tool: 'imagemagick7', available: true };
  } catch {
    // Try legacy ImageMagick v6 (convert command)
    try {
      await execAsync('convert -version');
      console.log('🖼️ Using system ImageMagick v6 installation');
      return { tool: 'imagemagick6', available: true };
    } catch {
      // Try GraphicsMagick
      try {
        await execAsync('gm -version');
        console.log('🖼️ Using system GraphicsMagick installation');
        return { tool: 'graphicsmagick', available: true };
      } catch {
        console.log('⚠️ No PDF processing tools available - PDF thumbnails will use placeholders');
        return { tool: 'none', available: false };
      }
    }
  }
}

/**
 * Get the appropriate convert command based on available tools
 */
function getConvertCommand(tool: string): string {
  // Priority: local installation > environment variable > system tools
  const localMagickPath = path.join(process.cwd(), 'tools', 'bin', 'magick.exe');
  const localConvertPath = path.join(process.cwd(), 'tools', 'bin', 'convert.exe');
  
  try {
    const fs = require('fs');
    if (process.platform === 'win32') {
      // For ImageMagick v7, prefer magick.exe over convert.exe to avoid deprecation warning
      if (fs.existsSync(localMagickPath)) {
        return `"${localMagickPath}"`;
      }
      if (fs.existsSync(localConvertPath)) {
        return `"${localConvertPath}"`;
      }
    }
  } catch {}

  // Check environment variables
  if (process.env.IMAGEMAGICK_MAGICK_PATH) {
    return `"${process.env.IMAGEMAGICK_MAGICK_PATH}"`;
  }
  
  if (process.env.IMAGEMAGICK_CONVERT_PATH) {
    return `"${process.env.IMAGEMAGICK_CONVERT_PATH}"`;
  }

  // System commands
  switch (tool) {
    case 'imagemagick7-local':
    case 'imagemagick7-env':
    case 'imagemagick7':
      return 'magick';
    case 'imagemagick-local':
    case 'imagemagick-env':
    case 'imagemagick6':
      return 'convert';
    case 'graphicsmagick':
      return 'gm convert';
    default:
      return 'magick'; // Default to ImageMagick v7
  }
}

/**
 * Extract page from PDF buffer as image
 */
export async function extractPDFPage(
  pdfBuffer: Buffer,
  config: Partial<PDFThumbnailConfig> = {}
): Promise<Buffer> {
  const finalConfig = { ...DEFAULT_PDF_CONFIG, ...config };
  
  // Check if PDF processing tool is available
  const toolInfo = await isPDFToolAvailable();
  if (!toolInfo.available) {
    console.log('⚠️ PDF processing tools not available, using placeholder');
    return await generatePDFPlaceholder();
  }

  // Generate temporary file paths
  const tempId = Math.random().toString(36).substring(7);
  const inputPath = path.join(tmpdir(), `pdf_input_${tempId}.pdf`);
  const outputPath = path.join(tmpdir(), `pdf_output_${tempId}.jpg`);

  try {
    console.log(`📄 Extracting PDF page ${finalConfig.pageNumber} with ${toolInfo.tool}...`);
      // Write PDF buffer to temporary file
    await writeFile(inputPath, pdfBuffer);

    let extractCommand: string;
    const convertCmd = getConvertCommand(toolInfo.tool);
    
    if (toolInfo.tool.includes('imagemagick7')) {
      // ImageMagick v7 command using 'magick' (modern syntax without 'convert')
      extractCommand = [
        `"${convertCmd}"`,
        '-density', finalConfig.density.toString(),
        '-quality', finalConfig.quality.toString(),
        `"${inputPath}[${finalConfig.pageNumber - 1}]"`, // ImageMagick uses 0-based page indexing
        '-resize', `"${finalConfig.maxWidth}x${finalConfig.maxHeight}>"`,
        '-colorspace', 'RGB',
        '-strip', // Remove metadata
        `"${outputPath}"`
      ].join(' ');    } else if (toolInfo.tool.includes('imagemagick')) {
      // ImageMagick v6 or legacy command using 'convert'
      extractCommand = [
        `"${convertCmd}"`,
        '-density', finalConfig.density.toString(),
        '-quality', finalConfig.quality.toString(),
        `"${inputPath}[${finalConfig.pageNumber - 1}]"`, // ImageMagick uses 0-based page indexing
        '-resize', `"${finalConfig.maxWidth}x${finalConfig.maxHeight}>"`,
        '-colorspace', 'RGB',
        '-strip', // Remove metadata
        `"${outputPath}"`
      ].join(' ');    } else {
      // GraphicsMagick command
      extractCommand = [
        'gm',
        'convert',
        '-density', finalConfig.density.toString(),
        '-quality', finalConfig.quality.toString(),
        `"${inputPath}[${finalConfig.pageNumber - 1}]"`,
        '-resize', `"${finalConfig.maxWidth}x${finalConfig.maxHeight}>"`,
        '-colorspace', 'RGB',
        '+profile', '*', // Remove profiles
        `"${outputPath}"`
      ].join(' ');
    }

    console.log('🔧 Running PDF extraction command:', extractCommand);
    await execAsync(extractCommand);

    // Check if output file was created
    try {
      await access(outputPath);
    } catch {
      throw new Error('PDF extraction output file not found');
    }

    // Read extracted page
    const pageBuffer = await readFile(outputPath);
    console.log(`✅ PDF page extracted: ${pageBuffer.length} bytes`);

    // Clean up temporary files
    await cleanupPDFTempFiles([inputPath, outputPath]);

    return pageBuffer;
  } catch (error) {
    console.error('❌ PDF page extraction failed:', error);
    
    // Clean up temporary files on error
    await cleanupPDFTempFiles([inputPath, outputPath]);
    
    // Fall back to placeholder
    return await generatePDFPlaceholder();
  }
}

/**
 * Generate PDF placeholder thumbnail
 */
async function generatePDFPlaceholder(): Promise<Buffer> {
  const svg = `
    <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pdfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="pageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#F3F4F6;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#pdfGrad)" rx="12"/>
      
      <!-- Document pages -->
      <rect x="50" y="80" width="300" height="380" fill="url(#pageGrad)" rx="8" stroke="#E5E7EB" stroke-width="2"/>
      <rect x="40" y="70" width="300" height="380" fill="url(#pageGrad)" rx="8" stroke="#E5E7EB" stroke-width="2"/>
      <rect x="30" y="60" width="300" height="380" fill="url(#pageGrad)" rx="8" stroke="#E5E7EB" stroke-width="2"/>
      
      <!-- PDF icon -->
      <circle cx="200" cy="180" r="35" fill="#EF4444"/>
      <text x="200" y="195" font-family="Arial, sans-serif" font-size="30" 
            text-anchor="middle" fill="white" font-weight="bold">PDF</text>
      
      <!-- Lines representing text -->
      <rect x="60" y="120" width="200" height="4" fill="#9CA3AF" rx="2"/>
      <rect x="60" y="140" width="240" height="4" fill="#9CA3AF" rx="2"/>
      <rect x="60" y="160" width="180" height="4" fill="#9CA3AF" rx="2"/>
      
      <rect x="60" y="220" width="220" height="4" fill="#9CA3AF" rx="2"/>
      <rect x="60" y="240" width="190" height="4" fill="#9CA3AF" rx="2"/>
      <rect x="60" y="260" width="250" height="4" fill="#9CA3AF" rx="2"/>
      <rect x="60" y="280" width="170" height="4" fill="#9CA3AF" rx="2"/>
      
      <!-- Document label -->
      <text x="200" y="350" font-family="Arial, sans-serif" font-size="16" 
            text-anchor="middle" fill="white" font-weight="bold">
        PDF Document
      </text>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Extract multiple pages from PDF for preview
 */
export async function extractMultiplePDFPages(
  pdfBuffer: Buffer,
  pageCount: number = 3
): Promise<Buffer[]> {
  const toolInfo = await isPDFToolAvailable();
  if (!toolInfo.available) {
    console.log('⚠️ PDF processing tools not available, returning single placeholder');
    const placeholder = await generatePDFPlaceholder();
    return [placeholder];
  }

  const pages: Buffer[] = [];
  
  try {
    // Extract requested number of pages
    for (let i = 1; i <= pageCount; i++) {
      try {
        const pageBuffer = await extractPDFPage(pdfBuffer, {
          pageNumber: i,
          density: 120, // Lower density for multiple pages
          quality: 80,
          maxWidth: 400,
          maxHeight: 500,
        });
        pages.push(pageBuffer);
      } catch (pageError) {
        console.error(`Failed to extract PDF page ${i}:`, pageError);
        // Stop trying to extract more pages if one fails
        break;
      }
    }

    return pages.length > 0 ? pages : [await generatePDFPlaceholder()];
  } catch (error) {
    console.error('❌ Multiple PDF page extraction failed:', error);
    return [await generatePDFPlaceholder()];
  }
}

/**
 * Get PDF metadata for thumbnail generation
 */
export async function getPDFMetadata(pdfBuffer: Buffer): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
} | null> {
  const toolInfo = await isPDFToolAvailable();
  if (!toolInfo.available) {
    return null;
  }

  const tempId = Math.random().toString(36).substring(7);
  const inputPath = path.join(tmpdir(), `pdf_meta_${tempId}.pdf`);

  try {
    await writeFile(inputPath, pdfBuffer);

    let identifyCommand: string;
    
    if (toolInfo.tool === 'imagemagick') {
      identifyCommand = `identify "${inputPath}"`;
    } else {
      identifyCommand = `gm identify "${inputPath}"`;
    }

    const { stdout } = await execAsync(identifyCommand);
    
    // Count pages from identify output
    const lines = stdout.trim().split('\n');
    const pageCount = lines.length;

    await cleanupPDFTempFiles([inputPath]);
    
    return {
      pageCount,
      title: undefined, // Could be enhanced with PDF metadata extraction
      author: undefined,
    };
  } catch (error) {
    console.error('Failed to get PDF metadata:', error);
    await cleanupPDFTempFiles([inputPath]);
    return null;
  }
}

/**
 * Clean up temporary PDF files
 */
async function cleanupPDFTempFiles(filePaths: string[]): Promise<void> {
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
 * Create PDF thumbnail grid from multiple pages
 */
export async function createPDFThumbnailGrid(
  pages: Buffer[],
  outputSize: { width: number; height: number } = { width: 200, height: 260 }
): Promise<Buffer> {
  if (pages.length === 0) {
    return await generatePDFPlaceholder();
  }

  if (pages.length === 1) {
    // Single page, just resize
    return await sharp(pages[0])
      .resize(outputSize.width, outputSize.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  try {
    // For multiple pages, create a grid layout
    const cols = Math.min(pages.length, 2);
    const rows = Math.ceil(pages.length / cols);
    
    const pageWidth = Math.floor(outputSize.width / cols);
    const pageHeight = Math.floor(outputSize.height / rows);

    // Resize all pages
    const resizedPages = await Promise.all(
      pages.map(page =>
        sharp(page)
          .resize(pageWidth, pageHeight, { fit: 'cover' })
          .toBuffer()
      )
    );

    // Create composite image
    const canvas = sharp({
      create: {
        width: outputSize.width,
        height: outputSize.height,
        channels: 3,
        background: { r: 239, g: 68, b: 68 } // Red background
      }
    });

    // Add pages to canvas
    const composite: any[] = [];
    resizedPages.forEach((page, index) => {
      const x = (index % cols) * pageWidth;
      const y = Math.floor(index / cols) * pageHeight;
      composite.push({ input: page, top: y, left: x });
    });

    return await canvas
      .composite(composite)
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Failed to create PDF thumbnail grid:', error);
    return await generatePDFPlaceholder();
  }
}
