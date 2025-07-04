import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { PaginationParams, FileSearchFilters } from '@/domains/user/user-file-types';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);

    // Extraction des paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') as 'createdAt' | 'name' | 'size' || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    const pagination: PaginationParams = {
      page: Math.max(1, page),
      limit: Math.min(50, Math.max(1, limit)), // Limite max de 50
      sortBy,
      sortOrder,
    };

    // Extraction des filtres de recherche
    const filters: FileSearchFilters = {};

    const name = searchParams.get('name');
    if (name) filters.name = name;

    const status = searchParams.get('status');
    if (status && ['active', 'expired', 'expiring_soon'].includes(status)) {
      filters.status = status as 'active' | 'expired' | 'expiring_soon';
    }

    const mimeType = searchParams.get('mimeType');
    if (mimeType) filters.mimeType = mimeType;

    const startDate = searchParams.get('startDate');
    if (startDate) filters.startDate = new Date(startDate);

    const endDate = searchParams.get('endDate');
    if (endDate) filters.endDate = new Date(endDate);

    const minSize = searchParams.get('minSize');
    if (minSize) filters.minSize = parseInt(minSize);

    const maxSize = searchParams.get('maxSize');
    if (maxSize) filters.maxSize = parseInt(maxSize);

    // Récupération des fichiers
    const fileRepository = new MongoFileRepository();
    const result = await fileRepository.findByUserId(userId, pagination, filters);

    // Log de l'activité
    logger.info('User files retrieved', {
      userId,
      page: pagination.page,
      limit: pagination.limit,
      totalFiles: result.total,
      hasFilters: Object.keys(filters).length > 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to retrieve user files', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
