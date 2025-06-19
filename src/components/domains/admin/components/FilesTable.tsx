'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Files,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Calendar,
  User,
  HardDrive,
  Shield,
  Clock,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  AlertTriangle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/core/utils';
import type { AdminFile } from '@/types/admin';

interface FilesTableProps {
  files: AdminFile[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export default function FilesTable({ files, isLoading, onRefresh }: FilesTableProps) {
  const t = useTranslations('Admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<AdminFile | null>(null);
  const [actionType, setActionType] = useState<'delete' | 'details' | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.mimeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );  const handleFileAction = async (file: AdminFile, action: 'delete') => {
    try {
      setIsActionLoading(true);
      
      // Extract just the filename without path (e.g., "public/file.txt" -> "file.txt")
      const filename = file.name.split('/').pop() || file.name;
      
      const endpoint = `/api/admin/files/${filename}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      toast.success(t('deleteFileSuccess'));
      
      // Call onRefresh safely
      if (onRefresh && typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('deleteFileError') + ': ' + errorMessage);
    } finally {
      setIsActionLoading(false);
      setSelectedFile(null);
      setActionType(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) 
      return <Archive className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm';
    if (mimeType.startsWith('video/')) return 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shadow-sm';
    if (mimeType.startsWith('audio/')) return 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-sm';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60 shadow-sm';
    return 'bg-gray-100/80 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-sm';
  };if (isLoading) {
    return (
      <Card className="bg-white/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 shadow-sm dark:shadow-gray-900/30 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200/60 dark:border-gray-700/60">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
            <Files className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t('filesManagement')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200/80 dark:bg-gray-700/60" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >        <Card className="bg-white/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 shadow-sm dark:shadow-gray-900/30 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
                  <Files className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {t('filesManagement')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('filesCount', { count: filteredFiles.length, total: files.length })}
                </CardDescription>
              </div>
                <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder={t('searchFiles')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-white/80 dark:bg-gray-700/60 border-gray-300/60 dark:border-gray-600/60 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  />
                </div>
                
                {onRefresh && (
                  <Button 
                    onClick={onRefresh} 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/60 transition-all duration-200"
                  >
                    {t('refresh')}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100/80 dark:bg-gray-700/60 flex items-center justify-center mb-4">
                  <Files className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {searchTerm ? t('noFilesFound') : t('noFiles')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  {searchTerm ? t('tryDifferentSearch') : t('noFilesDescription')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="group flex items-center justify-between rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-5 bg-white/70 dark:bg-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-700/60 hover:border-gray-300/80 dark:hover:border-gray-600/80 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-gray-900/30 dark:hover:shadow-gray-900/50 backdrop-blur-sm"
                  >                    <div className="flex items-center gap-5 flex-1">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${getFileTypeColor(file.mimeType)}`}>
                        {getFileIcon(file.mimeType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold truncate text-gray-900 dark:text-gray-50 group-hover:text-gray-700 dark:group-hover:text-white transition-colors">
                            {file.originalName}
                          </h3>                          {file.isPasswordProtected && (
                            <Badge variant="secondary" className="text-xs bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shadow-sm">
                              <Shield className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                        </div>
                          <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50/80 dark:bg-gray-700/60 transition-colors group-hover:bg-gray-100/80 dark:group-hover:bg-gray-600/60">
                            <HardDrive className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="font-semibold">{formatFileSize(file.size)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50/80 dark:bg-gray-700/60 transition-colors group-hover:bg-gray-100/80 dark:group-hover:bg-gray-600/60">
                            <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium">{new Date(file.uploadDate).toLocaleDateString()}</span>
                          </div>                          {file.userName ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50/80 dark:bg-blue-900/30 transition-colors group-hover:bg-blue-100/80 dark:group-hover:bg-blue-800/40">
                              <User className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">{file.userName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50/80 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 transition-colors group-hover:bg-orange-100/80 dark:group-hover:bg-orange-800/40">
                              <User className="h-3.5 w-3.5" />
                              <span className="font-semibold">Anonymous</span>
                            </div>
                          )}                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50/80 dark:bg-gray-700/60 transition-colors group-hover:bg-gray-100/80 dark:group-hover:bg-gray-600/60">
                            <Eye className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium">{file.downloadCount} views</span>
                          </div>
                          {file.expiresAt && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition-colors group-hover:bg-amber-100/80 dark:group-hover:bg-amber-800/40">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="font-medium">Expires {new Date(file.expiresAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>                      <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-600/60 transition-all duration-200 rounded-lg border border-transparent hover:border-gray-200/60 dark:hover:border-gray-600/60"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 shadow-xl dark:shadow-gray-900/50"                      >                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedFile(file);
                            setActionType('details');
                          }} 
                          className="cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/60 text-gray-900 dark:text-gray-100 focus:bg-gray-50/80 dark:focus:bg-gray-700/60 transition-colors"
                        >
                          <Eye className="mr-3 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          {t('viewDetails')}
                        </DropdownMenuItem><DropdownMenuSeparator className="bg-gray-200/80 dark:bg-gray-600/60" />
                        
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFile(file);
                            setActionType('delete');
                          }}
                          className="text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-50/80 dark:hover:bg-red-900/20 focus:bg-red-50/80 dark:focus:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="mr-3 h-4 w-4" />
                          {t('deleteFile')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>      {/* File Details Modal - Zero Knowledge Compliant */}
      {selectedFile && actionType === 'details' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border border-gray-200/60 dark:border-gray-700/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/60 dark:border-gray-700/60">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                {t('fileDetails')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setActionType(null);
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* File Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-600/60">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${getFileTypeColor(selectedFile.mimeType)}`}>
                  {getFileIcon(selectedFile.mimeType)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                    {selectedFile.originalName}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFile.mimeType} • {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {selectedFile.isPasswordProtected && (
                  <Badge variant="secondary" className="bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                    <Shield className="h-3 w-3 mr-1" />
                    Protected
                  </Badge>
                )}
              </div>

              {/* File Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-50/80 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-600/60">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">Basic Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">File ID:</span>
                        <span className="font-mono text-gray-900 dark:text-gray-100 bg-gray-100/80 dark:bg-gray-600/60 px-2 py-1 rounded text-xs">
                          {selectedFile.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Internal Name:</span>
                        <span className="font-mono text-gray-900 dark:text-gray-100 bg-gray-100/80 dark:bg-gray-600/60 px-2 py-1 rounded text-xs">
                          {selectedFile.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Upload Date:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {new Date(selectedFile.uploadDate).toLocaleString()}
                        </span>
                      </div>
                      {selectedFile.expiresAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {new Date(selectedFile.expiresAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>                  <div className="p-4 rounded-lg bg-gray-50/80 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-600/60">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">Privacy & Security</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Encryption:</span>
                        <Badge variant="outline" className="bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200/60 dark:border-green-800/60">
                          AES-256-GCM
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Password Protected:</span>
                        <Badge variant={selectedFile.isPasswordProtected ? "default" : "secondary"} className={
                          selectedFile.isPasswordProtected 
                            ? "bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60"
                            : "bg-gray-100/80 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-200/60 dark:border-gray-600/60"
                        }>
                          {selectedFile.isPasswordProtected ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-50/80 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-600/60">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">User Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Uploader:</span>
                        {selectedFile.userName ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 flex items-center justify-center">
                              <User className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {selectedFile.userName}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">IP Hash:</span>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-600/60 px-2 py-1 rounded">
                          {selectedFile.ipHash || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50/80 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-600/60">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">Usage Statistics</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Views:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {selectedFile.downloadCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Download Limit:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {selectedFile.downloadLimit || 'Unlimited'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zero Knowledge Notice */}
              <div className="p-4 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h6 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Zero Knowledge Architecture
                    </h6>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      This file is encrypted client-side with AES-256-GCM. The server cannot access the content without the encryption key, which is never stored on our servers. File preview and download are not available through the admin interface to maintain zero-knowledge compliance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/60 dark:border-gray-700/60">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setActionType(null);
                  }}
                  className="border-gray-300/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/60"
                >
                  Close
                </Button>                <Button
                  onClick={() => {
                    setActionType('delete');
                  }}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-lg shadow-red-500/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Confirmation Dialogs - Enhanced dark mode */}
      {selectedFile && actionType === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-6 shadow-2xl border border-gray-200/60 dark:border-gray-700/60">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
              {t('deleteFileConfirmTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {t('deleteFileConfirmDescription', { name: selectedFile.originalName })}
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedFile(null);
                  setActionType(null);
                }}
                disabled={isActionLoading}
                className="border-gray-300/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/60 transition-all duration-200"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => {
                  handleFileAction(selectedFile, 'delete');
                }}
                disabled={isActionLoading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all duration-200"
              >
                {isActionLoading ? t('deleting') : t('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
