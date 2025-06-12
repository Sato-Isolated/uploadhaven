import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const publicDir = path.join(uploadsDir, 'public');
    const protectedDir = path.join(uploadsDir, 'protected');

    let allFiles: Array<{
      name: string;
      path: string;
      size: number;
      createdAt: Date;
      modifiedAt: Date;
      extension: string;
      isProtected: boolean;
    }> = [];

    try {
      // Get files from public directory
      try {
        const publicFiles = await readdir(publicDir);
        const publicFileDetails = await Promise.all(
          publicFiles.map(async (fileName) => {
            const filePath = path.join(publicDir, fileName);
            const stats = await stat(filePath);

            return {
              name: fileName,
              path: filePath,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              extension: path.extname(fileName).toLowerCase(),
              isProtected: false,
            };
          })
        );
        allFiles = [...allFiles, ...publicFileDetails];
      } catch (error) {
        console.warn('Could not read public uploads directory:', error);
      }

      // Get files from protected directory
      try {
        const protectedFiles = await readdir(protectedDir);
        const protectedFileDetails = await Promise.all(
          protectedFiles.map(async (fileName) => {
            const filePath = path.join(protectedDir, fileName);
            const stats = await stat(filePath);

            return {
              name: fileName,
              path: filePath,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              extension: path.extname(fileName).toLowerCase(),
              isProtected: true,
            };
          })
        );
        allFiles = [...allFiles, ...protectedFileDetails];
      } catch (error) {
        console.warn('Could not read protected uploads directory:', error);
      }

      // Filter out directories and system files
      const validFiles = allFiles.filter(
        (file) => file.extension && !file.name.startsWith('.') && file.size > 0
      );

      return NextResponse.json({
        files: validFiles.slice(0, 20), // Limit to 20 files for performance
        total: validFiles.length,
      });
    } catch (error) {
      console.error('Error reading uploads directories:', error);
      return NextResponse.json({
        files: [],
        total: 0,
        error: 'Unable to access uploads directories',
      });
    }
  } catch (error) {
    console.error('Failed to list files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
