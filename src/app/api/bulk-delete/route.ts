import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { File, saveSecurityEvent } from '@/lib/database/models';
import { headers } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'Unknown'; // Get the request body to see if specific files are requested
    const body = await request.json().catch(() => ({}));
    const { filenames } = body;

    interface QueryType {
      isDeleted: boolean;
      filename?: { $in: string[] };
    }

    let query: QueryType = { isDeleted: false };

    // If specific filenames are provided, only delete those
    if (filenames && Array.isArray(filenames)) {
      query = { ...query, filename: { $in: filenames } };
    }

    // Find files to delete
    const filesToDelete = await File.find(query);

    if (filesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No files found to delete',
      });
    }

    // Mark files as deleted in database
    const result = await File.updateMany(query, { isDeleted: true }); // Try to delete actual files from filesystem
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

    // Log security event
    await saveSecurityEvent({
      type: 'bulk_delete',
      ip,
      details: `Bulk deleted ${result.modifiedCount} files`,
      severity: 'medium',
      userAgent,
      metadata: {
        deletedCount: result.modifiedCount,
        physicalDeletedCount,
        errors: errors.length,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.modifiedCount,
      physicalDeletedCount,
      totalFiles: filesToDelete.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk delete' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use DELETE to clear all files.' },
    { status: 405 }
  );
}
