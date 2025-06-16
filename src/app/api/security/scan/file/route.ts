import { NextRequest, NextResponse } from 'next/server';
import MalwareScanner from '@/lib/server/malware-scanner';
import path from 'path';
import { readFile } from 'fs/promises';
import { logSecurityEvent } from '@/lib/core/security';
import connectDB from '@/lib/database/mongodb';
import { saveNotification, File } from '@/lib/database/models';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB for potential notification creation
    await connectDB();

    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'No file name provided' },
        { status: 400 }
      );
    } // Build path to the uploaded file
    // We need to check both public and protected directories since we don't know which one this file is in
    const publicFilePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'public',
      fileName
    );
    const protectedFilePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'protected',
      fileName
    );

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
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    } // Initialize malware scanner
    const scanner = new MalwareScanner();

    // Check if scanning is enabled
    if (!scanner.isScanningEnabled()) {
      return NextResponse.json({
        scanResult: {
          isClean: true,
          isSuspicious: false,
          isMalicious: false,
          threatName: 'Malware scanning disabled',
          source: 'local',
          scannedAt: new Date(),
        },
        quotaStatus: null,
      });
    }

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
      scanResult.isMalicious
        ? 'high'
        : scanResult.isSuspicious
          ? 'medium'
          : 'low'
    );

    // Create critical security notifications for malware/suspicious files
    if (scanResult.isMalicious || scanResult.isSuspicious) {
      try {
        // Find the file in database to get the owner
        const fileDoc = await File.findOne({
          $or: [
            { filename: `public/${fileName}` },
            { filename: `protected/${fileName}` },
          ],
        });

        if (fileDoc && fileDoc.userId) {
          const notificationType = scanResult.isMalicious
            ? 'malware_detected'
            : 'security_alert';
          const priority = scanResult.isMalicious ? 'urgent' : 'high';
          const title = scanResult.isMalicious
            ? 'Malware Detected'
            : 'Suspicious File Detected';
          const message = scanResult.isMalicious
            ? `Malware detected in your file "${fileDoc.originalName}". The file has been flagged for security review.`
            : `Suspicious activity detected in your file "${fileDoc.originalName}". Please review the file content.`;

          await saveNotification({
            userId: fileDoc.userId,
            type: notificationType,
            title,
            message,
            priority,
            relatedFileId: fileDoc._id.toString(),
            metadata: {
              fileName: fileDoc.originalName,
              scanResult: {
                isMalicious: scanResult.isMalicious,
                isSuspicious: scanResult.isSuspicious,
                threatName: scanResult.threatName,
                source: scanResult.source,
                scannedAt: scanResult.scannedAt.toISOString(),
              },
              severity: scanResult.isMalicious ? 'critical' : 'high',
            },
          });
        }
      } catch (notificationError) {
        console.error(
          'Failed to create security notification:',
          notificationError
        );
        // Don't fail the scan if notification creation fails
      }
    }

    return NextResponse.json({
      fileName,
      scanResult,
      quotaStatus,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('File scan failed:', error);
    return NextResponse.json({ error: 'File scan failed' }, { status: 500 });
  }
}
