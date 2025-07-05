import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
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

    // Retrieve user statistics
    const fileRepository = new MongoFileRepository();
    const stats = await fileRepository.getUserFileStats(userId);

    // Helper to format file sizes
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Enrichir les stats avec des informations formatées
    const enrichedStats = {
      ...stats,
      totalSizeFormatted: formatFileSize(stats.totalSize),
      averageFileSize: stats.totalFiles > 0 ? Math.round(stats.totalSize / stats.totalFiles) : 0,
      averageFileSizeFormatted: stats.totalFiles > 0 ? formatFileSize(Math.round(stats.totalSize / stats.totalFiles)) : '0 B',
      averageDownloadsPerFile: stats.totalFiles > 0 ? Math.round(stats.totalDownloads / stats.totalFiles * 100) / 100 : 0,
    };

    // Log de l'activité
    logger.info('User stats retrieved', {
      userId,
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
    });

    return NextResponse.json(enrichedStats);
  } catch (error) {
    logger.error('Failed to retrieve user stats', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
