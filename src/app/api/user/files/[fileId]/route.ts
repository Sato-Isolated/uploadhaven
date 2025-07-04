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
    // Vérifier l'authentification
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

    // Vérifier que le fichier existe et appartient à l'utilisateur
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
      // Trouver le partage pour ce fichier (il n'y en a généralement qu'un)
      const share = await shareRepository.findByFileId(fileId);
      
      // Supprimer le partage s'il existe
      if (share) {
        await shareRepository.delete(share.id);
        
        // Log de la suppression du partage
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
      // Continuer même si la suppression du partage échoue
    }

    // Supprimer le fichier physique du système de fichiers
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
      // Continuer même si la suppression physique échoue
    }

    // Supprimer l'enregistrement du fichier en base
    await fileRepository.deleteByUserAndId(userId, fileId);

    // Log de l'audit pour la suppression du fichier
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
