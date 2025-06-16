#!/usr/bin/env node
/**
 * Thumbnail System Test Script
 * 
 * Tests the encrypted thumbnail generation system with real files.
 * Validates FFmpeg, ImageMagick, and the complete thumbnail workflow.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { generateEncryptedThumbnail, decryptThumbnail } from '@/lib/encryption/thumbnail-encryption';
import { extractVideoFrame, isFFmpegAvailable } from '@/lib/media/video-frame-extraction';
import { extractPDFPage, isPDFToolAvailable } from '@/lib/media/pdf-thumbnail-extraction';
import type { IFile } from '@/types/database';

// Test files configuration
const TEST_FILES = [
  { name: 'image.jpg', type: 'image/jpeg', expectedTool: 'Sharp' },
  { name: 'image.png', type: 'image/png', expectedTool: 'Sharp' },
  { name: 'video.mp4', type: 'video/mp4', expectedTool: 'FFmpeg' },
  { name: 'pdf.pdf', type: 'application/pdf', expectedTool: 'ImageMagick' },
];

const TEST_DIR = path.join(process.cwd(), 'test-files');
const OUTPUT_DIR = path.join(process.cwd(), 'test-output');

async function main() {
  console.log('🧪 Starting Thumbnail System Test');
  console.log('================================');
  console.log('');

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Check tool availability
  console.log('🔍 Checking tool availability...');
  const ffmpegAvailable = await isFFmpegAvailable();
  const pdfToolInfo = await isPDFToolAvailable();
  
  console.log(`   FFmpeg: ${ffmpegAvailable ? '✅ Available' : '❌ Not available'}`);
  console.log(`   PDF Tool: ${pdfToolInfo.available ? `✅ ${pdfToolInfo.tool}` : '❌ Not available'}`);
  console.log('');

  let successCount = 0;
  let totalTests = 0;

  for (const testFile of TEST_FILES) {
    console.log(`🖼️  Testing: ${testFile.name} (${testFile.type})`);
    console.log(`   Expected tool: ${testFile.expectedTool}`);
    
    try {
      totalTests++;
      const startTime = Date.now();

      // Read test file
      const filePath = path.join(TEST_DIR, testFile.name);
      const fileBuffer = await readFile(filePath);
      console.log(`   File size: ${fileBuffer.length} bytes`);

      // Create mock file document
      const mockFileDoc: IFile = {
        _id: `test_${testFile.name}`,
        filename: testFile.name,
        shortUrl: `test_${Date.now()}`,
        originalName: testFile.name,
        mimeType: testFile.type,
        size: fileBuffer.length,
        uploadDate: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-script',
        isAnonymous: true,
        isDeleted: false,
        isEncrypted: false,
        scanResult: { safe: true, scanDate: new Date() },
        isPasswordProtected: false,
      } as IFile;

      // Generate encrypted thumbnail
      console.log('   Generating encrypted thumbnail...');
      const thumbnailResult = await generateEncryptedThumbnail(
        mockFileDoc,
        fileBuffer,
        testFile.type
      );

      console.log(`   Thumbnail size: ${thumbnailResult.thumbnailBuffer.length} bytes`);
      console.log(`   Encryption: ${thumbnailResult.metadata.algorithm}`);

      // Decrypt thumbnail
      console.log('   Decrypting thumbnail...');
      const decryptedThumbnail = await decryptThumbnail(
        thumbnailResult.thumbnailBuffer,
        thumbnailResult.metadata
      );

      // Save outputs for inspection
      const outputPath = path.join(OUTPUT_DIR, `${testFile.name}_thumbnail.webp`);
      await writeFile(outputPath, decryptedThumbnail);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`   ✅ Success! Generated in ${duration}ms`);
      console.log(`   Output saved: ${outputPath}`);
      successCount++;

    } catch (error) {
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('   Error details:', error);
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalTests - successCount}`);
  console.log(`Success rate: ${Math.round((successCount / totalTests) * 100)}%`);
  console.log('');

  if (successCount === totalTests) {
    console.log('🎉 All tests passed! Thumbnail system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the error details above.');
  }

  console.log('');
  console.log('📁 Output files saved in: test-output/');
  console.log('   You can inspect the generated thumbnails manually.');
}

// Test individual extraction functions
async function testExtractionFunctions() {
  console.log('🔧 Testing individual extraction functions...');
  console.log('');

  // Test video frame extraction
  if (await isFFmpegAvailable()) {
    try {
      console.log('🎥 Testing video frame extraction...');
      const videoPath = path.join(TEST_DIR, 'video.mp4');
      const videoBuffer = await readFile(videoPath);
      
      const frame = await extractVideoFrame(videoBuffer);
      await writeFile(path.join(OUTPUT_DIR, 'video_frame_test.jpg'), frame);
      
      console.log('   ✅ Video frame extraction successful');
    } catch (error) {
      console.log('   ❌ Video frame extraction failed:', error);
    }
  }

  // Test PDF page extraction
  const pdfToolInfo = await isPDFToolAvailable();
  if (pdfToolInfo.available) {
    try {
      console.log('📄 Testing PDF page extraction...');
      const pdfPath = path.join(TEST_DIR, 'pdf.pdf');
      const pdfBuffer = await readFile(pdfPath);
      
      const page = await extractPDFPage(pdfBuffer);
      await writeFile(path.join(OUTPUT_DIR, 'pdf_page_test.jpg'), page);
      
      console.log('   ✅ PDF page extraction successful');
    } catch (error) {
      console.log('   ❌ PDF page extraction failed:', error);
    }
  }

  console.log('');
}

// Run tests
if (require.main === module) {
  main()
    .then(() => testExtractionFunctions())
    .then(() => {
      console.log('🏁 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { main as runThumbnailTests };
