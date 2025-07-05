import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { MongoShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { MongoAuditRepository } from '@/infrastructure/database/mongo-audit-repository';
import { AuditService } from '@/domains/audit/audit-service';
import { getDb } from '@/infrastructure/database/mongodb';
import { logger } from '@/lib/logger';
import { unlink } from 'fs/promises';
import { join } from 'path';

interface RouteParams {
  params: {
    fileId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const fileRepository = new MongoFileRepository();
    const shareRepository = new MongoShareRepository();
    const auditRepository = new MongoAuditRepository(db);
    const auditService = new AuditService(auditRepository);

    // Check that the file exists and belongs to the user
    const file = await fileRepository.findById(fileId);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    if (!file.belongsToUser(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized: File does not belong to user' },
        { status: 403 }
      );
    }

    // Supprimer les partages associés
    try {
      // Find the share for this file (there's usually only one)
      const share = await shareRepository.findByFileId(fileId);
      
      // Supprimer le partage s'il existe
      if (share) {
        await shareRepository.delete(share.id);
        
        // Log share deletion
        await auditService.logShareEvent(
          'share.delete',
          share.id,
          {
            ip: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown',
            userAgent: request.headers.get('user-agent') || undefined,
            userId,
          },
          { reason: 'file_deletion', fileName: file.originalName }
        );
      }
    } catch (error) {
      logger.warn('Failed to delete share during file deletion', { 
        fileId, 
        userId, 
        error 
      });
      // Continue even if share deletion fails
    }

    // Delete physical file from filesystem
    try {
      const filePath = join(process.cwd(), 'uploads', file.encryptedPath);
      await unlink(filePath);
      logger.debug('Physical file deleted', { fileId, path: file.encryptedPath });
    } catch (error) {
      logger.warn('Failed to delete physical file', { 
        fileId, 
        path: file.encryptedPath, 
        error 
      });
      // Continue even if physical deletion fails
    }

    // Delete file record from database
    await fileRepository.deleteByUserAndId(userId, fileId);

    // Audit log for file deletion
    await auditService.logFileEvent(
      'file.delete',
      fileId,
      {
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        userId,
      },
      { 
        fileName: file.originalName,
        fileSize: file.size,
        reason: 'user_request'
      }
    );

    logger.info('File deleted by user', {
      userId,
      fileId,
      fileName: file.originalName,
      fileSize: file.size,
    });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete file', { 
      fileId: params.fileId, 
      error 
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
