import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      const files = await readdir(uploadsDir);
      const fileDetails = await Promise.all(
        files.map(async (fileName) => {
          const filePath = path.join(uploadsDir, fileName);
          const stats = await stat(filePath);
          
          return {
            name: fileName,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            extension: path.extname(fileName).toLowerCase()
          };
        })
      );

      // Filter out directories and system files
      const validFiles = fileDetails.filter(file => 
        file.extension && 
        !file.name.startsWith('.') &&
        file.size > 0
      );

      return NextResponse.json({
        files: validFiles.slice(0, 20), // Limit to 20 files for performance
        total: validFiles.length
      });

    } catch (error) {
      console.error('Error reading uploads directory:', error);
      return NextResponse.json({
        files: [],
        total: 0,
        error: 'Unable to access uploads directory'
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
