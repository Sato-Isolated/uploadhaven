import { NextRequest, NextResponse } from 'next/server';
import MalwareScanner from '@/lib/server/malware-scanner';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { logSecurityEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });

    // Write file to temp location for scanning
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join(tempDir, `scan_${Date.now()}_${file.name}`);
    await writeFile(tempFilePath, buffer);

    // Initialize malware scanner
    const scanner = new MalwareScanner();
    
    // Perform scan
    const scanResult = await scanner.scanFile(tempFilePath);
    
    // Get quota status
    const quotaStatus = scanner.isConfigured() 
      ? await scanner.getQuotaStatus()
      : null;

    // Log security event
    logSecurityEvent(
      'file_scan',
      `File scan completed: ${file.name} - ${scanResult.isMalicious ? 'THREAT' : scanResult.isSuspicious ? 'SUSPICIOUS' : 'CLEAN'}`,
      scanResult.isMalicious ? 'high' : scanResult.isSuspicious ? 'medium' : 'low'
    );

    // Clean up temp file (in production, you might want to keep it for quarantine)
    try {
      const { unlink } = await import('fs/promises');
      await unlink(tempFilePath);
    } catch (error) {
      console.error('Failed to clean up temp file:', error);
    }

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      scanResult,
      quotaStatus,
      scannedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('File scan failed:', error);
    return NextResponse.json(
      { error: 'File scan failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const scanner = new MalwareScanner();
    
    const quotaStatus = scanner.isConfigured() 
      ? await scanner.getQuotaStatus()
      : null;

    return NextResponse.json({
      virusTotalConfigured: scanner.isConfigured(),
      quotaStatus
    });
  } catch (error) {
    console.error('Failed to get scan status:', error);
    return NextResponse.json(
      { error: 'Failed to get scan status' },
      { status: 500 }
    );
  }
}
