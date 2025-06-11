import { NextRequest, NextResponse } from 'next/server';
import MalwareScanner from '@/lib/server/malware-scanner';
import path from 'path';
import { logSecurityEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const { fileNames } = await request.json();
    
    if (!fileNames || !Array.isArray(fileNames)) {
      return NextResponse.json(
        { error: 'No file names provided or invalid format' },
        { status: 400 }
      );
    }    const scanner = new MalwareScanner();
    const results = [];
    let requestsUsed = 0;    for (const fileName of fileNames.slice(0, 10)) { // Limit to 10 files to prevent abuse
      try {
        // We need to check both public and protected directories since we don't know which one this file is in
        const publicFilePath = path.join(process.cwd(), 'public', 'uploads', 'public', fileName);
        const protectedFilePath = path.join(process.cwd(), 'public', 'uploads', 'protected', fileName);
        
        let filePath: string;
        try {
          // Check if file exists in public directory first
          const { readFile } = await import('fs/promises');
          await readFile(publicFilePath);
          filePath = publicFilePath;
        } catch {
          try {
            // Check if file exists in protected directory
            const { readFile } = await import('fs/promises');
            await readFile(protectedFilePath);
            filePath = protectedFilePath;
          } catch {
            results.push({
              fileName,
              error: 'File not found',
              scannedAt: new Date().toISOString()
            });
            continue;
          }
        }
        
        // Perform scan
        const scanResult = await scanner.scanFile(filePath);
        
        // Track VirusTotal requests
        if (scanResult.source === 'virustotal') {
          requestsUsed++;
        }
        
        results.push({
          fileName,
          scanResult,
          scannedAt: new Date().toISOString()
        });        // Log security event for each file
        logSecurityEvent(
          'file_scan',
          `File scan: ${fileName} - ${scanResult.isMalicious ? 'THREAT' : scanResult.isSuspicious ? 'SUSPICIOUS' : 'CLEAN'}`,
          scanResult.isMalicious ? 'high' : scanResult.isSuspicious ? 'medium' : 'low'
        );

      } catch (error) {
        console.error(`Failed to scan file ${fileName}:`, error);
        results.push({
          fileName,
          error: 'Scan failed',
          scannedAt: new Date().toISOString()
        });
      }
    }

    // Get updated quota status
    const updatedQuotaStatus = scanner.isConfigured() 
      ? await scanner.getQuotaStatus()
      : null;

    return NextResponse.json({
      results,
      requestsUsed,
      quotaStatus: updatedQuotaStatus,
      totalScanned: results.length,
      threatsFound: results.filter(r => r.scanResult?.isMalicious).length,
      suspiciousFound: results.filter(r => r.scanResult?.isSuspicious).length
    });

  } catch (error) {
    console.error('Bulk file scan failed:', error);
    return NextResponse.json(
      { error: 'Bulk file scan failed' },
      { status: 500 }
    );
  }
}
