import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import { File } from '@/lib/models';
import DeleteFileButton from '@/components/domains/ui/buttons/DeleteFileButton';
import CopyLinkButton from '@/components/domains/ui/buttons/CopyLinkButton';
import { getTranslations } from 'next-intl/server';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  FileIcon, 
  Download, 
  Calendar,
  HardDrive,
  Home,
  Grid3x3,
  List
} from 'lucide-react';

// Function to get file icon based on mime type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText;
  return FileIcon;
}

// Function to get file type label
function getFileTypeLabel(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('text')) return 'Text';
  return 'File';
}

// Function to format file size
function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getUserFiles(userId: string) {
  await connectDB();
  return await File.find({
    userId: userId,
    isDeleted: false,
  })
    .sort({ uploadDate: -1 })
    .limit(50)
    .lean();
}

interface UserFileData {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  expiresAt: Date;
  // Visibility removed - all files use security by obscurity
  downloadCount?: number;
}

export default async function UserFilesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/auth/signin');
  }

  const files = (await getUserFiles(
    session.user.id
  )) as unknown as UserFileData[];

  const t = await getTranslations('Files');
  const tNavigation = await getTranslations('Navigation');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {t('myFiles')}
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                {t('manageFiles')} • {files.length} {files.length === 1 ? 'fichier' : 'fichiers'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                  <List className="h-4 w-4" />
                  {t('backToDashboard')}
                </Button>
              </Link>              <Link href="/dashboard">
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  <Home className="h-4 w-4" />
                  {tNavigation('home')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        {files.length === 0 ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <div className="mb-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <FileIcon className="h-10 w-10 text-gray-400" />
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {t('noFilesYet')}
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  {t('startByUploading')}
                </p>                <Link href="/dashboard">
                  <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                    <Home className="h-4 w-4" />
                    {tNavigation('home')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file: UserFileData) => {
              const IconComponent = getFileIcon(file.mimeType);
              const isExpired = new Date(file.expiresAt) < new Date();
              
              return (
                <Card key={file._id} className="group overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <IconComponent className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base font-semibold text-gray-900 dark:text-white">
                          {file.originalName}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {getFileTypeLabel(file.mimeType)}
                          </Badge>
                          {isExpired && (
                            <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Expiré
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* File Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <HardDrive className="h-4 w-4" />
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Download className="h-4 w-4" />
                        <span>{file.downloadCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span className={isExpired ? 'text-red-500' : ''}>
                          {new Date(file.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700" 
                        asChild
                        disabled={isExpired}
                      >
                        <a
                          href={`/api/files/${file.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="mr-1 h-3 w-3" />
                          {t('download')}
                        </a>
                      </Button>
                      <CopyLinkButton filename={file.filename} />
                      <DeleteFileButton
                        filename={file.filename}
                        fileName={file.originalName}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
