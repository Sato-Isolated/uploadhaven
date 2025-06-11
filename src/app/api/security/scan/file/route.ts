import { NextRequest, NextResponse } from 'next/server';
import MalwareScanner from '@/lib/server/malware-scanner';
import path from 'path';
import { readFile } from 'fs/promises';
import { logSecurityEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'No file name provided' },
        { status: 400 }
      );
    }    // Build path to the uploaded file
    // We need to check both public and protected directories since we don't know which one this file is in
    const publicFilePath = path.join(process.cwd(), 'public', 'uploads', 'public', fileName);
    const protectedFilePath = path.join(process.cwd(), 'public', 'uploads', 'protected', fileName);
    
    let filePath: string;
    try {
      // Check if file exists in public directory first
      await readFile(publicFilePath);
      filePath = publicFilePath;
    } catch {
      try {
        // Check if file exists in protected directory
        await readFile(protectedFilePath);
        filePath = protectedFilePath;
      } catch {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
    }

    // Initialize malware scanner
    const scanner = new MalwareScanner();
    
    // Perform scan
    const scanResult = await scanner.scanFile(filePath);
    
    // Get quota status
    const quotaStatus = scanner.isConfigured() 
      ? await scanner.getQuotaStatus()
      : null;

    // Log security event
    logSecurityEvent(
      'file_scan',
      `File scan completed: ${fileName} - ${scanResult.isMalicious ? 'THREAT' : scanResult.isSuspicious ? 'SUSPICIOUS' : 'CLEAN'}`,
      scanResult.isMalicious ? 'high' : scanResult.isSuspicious ? 'medium' : 'low'
    );

    return NextResponse.json({
      fileName,
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
