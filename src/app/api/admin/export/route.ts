import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User, File, saveSecurityEvent } from '@/lib/database/models';
import { headers } from 'next/headers';

interface ExportedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: Date;
  last_updated: Date;
  email_verified: boolean;
  is_active: boolean;
}

interface ExportedFile {
  id: string;
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  upload_date: Date;
  download_count: number;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  is_anonymous: boolean;
  short_url: string;
  expires_at?: Date;
}

interface UserExportData {
  export_type: 'users';
  export_date: string;
  total_count: number;
  users: ExportedUser[];
}

interface FileExportData {
  export_type: 'files';
  export_date: string;
  total_count: number;
  files: ExportedFile[];
}

type ExportData = UserExportData | FileExportData;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'Unknown';

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'users';

    let data: ExportData;
    let filename = '';
    if (type === 'users') {
      // Export user data
      const users = await User.find(
        {},
        {
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
          emailVerified: 1,
          lastActivity: 1,
        }
      ).sort({ createdAt: -1 });

      data = {
        export_type: 'users',
        export_date: new Date().toISOString(),
        total_count: users.length,
        users: users.map((user) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.createdAt,
          last_updated: user.updatedAt,
          email_verified: user.emailVerified,
          is_active:
            user.lastActivity > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Active within 30 days
        })),
      };
      filename = `users_export_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'files') {
      // Export file data
      const files = await File.find({}).sort({ uploadDate: -1 });

      data = {
        export_type: 'files',
        export_date: new Date().toISOString(),
        total_count: files.length,
        files: files.map((file) => ({
          id: file._id.toString(),
          filename: file.filename,
          original_name: file.originalName,
          size: file.size,
          mime_type: file.mimeType,
          upload_date: file.uploadDate,
          download_count: file.downloadCount,
          user_id: file.userId?.toString(),
          user_name: undefined, // Would need separate query to get user name
          user_email: undefined, // Would need separate query to get user email
          is_anonymous: file.isAnonymous,
          short_url: file.shortUrl,
          expires_at: file.expiresAt,
        })),
      };
      filename = `files_export_${new Date().toISOString().split('T')[0]}`;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid export type. Use 'users' or 'files'",
        },
        { status: 400 }
      );
    } // Log security event
    await saveSecurityEvent({
      type: 'data_export',
      ip,
      details: `Admin exported ${type} data in ${format} format`,
      severity: 'medium',
      userAgent,
      metadata: {
        export_type: type,
        format,
        record_count:
          data.export_type === 'users' ? data.users.length : data.files.length,
        adminAction: true,
      },
    });

    if (format === 'csv') {
      // Convert to CSV format
      let csvContent = '';

      if (type === 'users' && data.export_type === 'users') {
        csvContent =
          'ID,Name,Email,Role,Created At,Email Verified,Is Active\\n';
        csvContent += data.users
          .map(
            (user: ExportedUser) =>
              `"${user.id}","${user.name || ''}","${user.email}","${
                user.role
              }","${user.created_at}","${user.email_verified}","${
                user.is_active
              }"`
          )
          .join('\\n');
      } else if (type === 'files' && data.export_type === 'files') {
        csvContent =
          'ID,Filename,Original Name,Size,MIME Type,Upload Date,Download Count,User Email,Is Anonymous\\n';
        csvContent += data.files
          .map(
            (file: ExportedFile) =>
              `"${file.id}","${file.filename}","${file.original_name}","${
                file.size
              }","${file.mime_type}","${file.upload_date}","${
                file.download_count
              }","${file.user_email || ''}","${file.is_anonymous}"`
          )
          .join('\\n');
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // Return JSON format
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
