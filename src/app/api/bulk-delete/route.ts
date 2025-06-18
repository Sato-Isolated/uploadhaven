import { NextRequest } from 'next/server';
import { withAuthenticatedAPI, createSuccessResponse, createErrorResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { File, saveSecurityEvent } from '@/lib/database/models';
import { headers } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';

export const DELETE = withAuthenticatedAPI(async (request: AuthenticatedRequest) => {
  const { user } = request;

  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for') ||
    headersList.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = headersList.get('user-agent') || 'Unknown';

  // Get the request body to see if specific files are requested
  const body = await (request as unknown as NextRequest).json().catch(() => ({}));
  const { filenames } = body;

  interface QueryType {
    isDeleted: boolean;
    userId: string;
    filename?: { $in: string[] };
  }

  let query: QueryType = { 
    isDeleted: false,
    userId: user.id // Only allow users to delete their own files
  };

  // If specific filenames are provided, only delete those
  if (filenames && Array.isArray(filenames)) {
    query = { ...query, filename: { $in: filenames } };
  }

  // Find files to delete
  const filesToDelete = await File.find(query);

  if (filesToDelete.length === 0) {
    return createSuccessResponse({
      deletedCount: 0,
      message: 'No files found to delete',
    });
  }

  // Mark files as deleted in database
  const result = await File.updateMany(query, { isDeleted: true });
  
  // Try to delete actual files from filesystem
  let physicalDeletedCount = 0;
  const errors: string[] = [];
  for (const file of filesToDelete) {
    try {
      // Determine which subdirectory based on password protection
      const subDir = file.isPasswordProtected ? 'protected' : 'public';
      const uploadsDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        subDir
      );
      const filePath = path.join(uploadsDir, file.filename);
      await unlink(filePath);
      physicalDeletedCount++;
    } catch (error) {
      errors.push(
        `Failed to delete ${file.filename} from filesystem: ${error}`
      );
    }
  }

  // Log bulk deletion
  await saveSecurityEvent({
    type: 'bulk_file_deletion',
    ip,
    details: `Bulk deletion completed: ${result.modifiedCount} files marked as deleted`,
    severity: 'medium',
    userAgent,
    userId: user.id,
    metadata: {
      deletedCount: result.modifiedCount,
      physicalDeletedCount,
      errors: errors.length,
    },
  });

  return createSuccessResponse({
    deletedCount: result.modifiedCount,
    physicalDeletedCount,
    totalFiles: filesToDelete.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

export async function GET() {
  return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
}
