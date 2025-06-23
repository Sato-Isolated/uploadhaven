import { NextRequest, NextResponse } from 'next/server';
import { DomainContainer } from '@/shared/infrastructure/di/domain-container';
import { FileId } from '@/domains/file-sharing/domain/value-objects/file-id.vo';

/**
 * GET /api/file-info/[id]
 * 
 * Returns public metadata about a file without requiring decryption keys.
 * This is safe to call without authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileIdString } = await params;

    if (!fileIdString) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Create FileId value object
    const fileId = FileId.fromString(fileIdString);

    // Get domain container and repository
    const domainContainer = DomainContainer.getInstance();
    await domainContainer.waitForInitialization();
    const fileRepository = await domainContainer.getFileRepository();

    // Get file info
    const sharedFile = await fileRepository.findById(fileId);

    if (!sharedFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if file is expired
    if (sharedFile.isExpired) {
      return NextResponse.json({ error: 'File has expired' }, { status: 410 });
    }

    // Return safe metadata only
    return NextResponse.json({
      data: {
        fileId: sharedFile.id,
        expiresAt: sharedFile.expiresAt.toISOString(),
        maxDownloads: sharedFile.maxDownloads >= 1000 ? null : sharedFile.maxDownloads, // null = unlimited
        downloadCount: sharedFile.downloadCount,
        isPasswordProtected: false, // We can't determine this from stored data safely
        size: sharedFile.size,
        createdAt: sharedFile.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('File info lookup failed:', error);
    return NextResponse.json({ error: 'Failed to get file info' }, { status: 500 });
  }
}
