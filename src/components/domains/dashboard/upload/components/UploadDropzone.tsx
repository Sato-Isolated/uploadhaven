'use client';

import { motion } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { Badge } from '@/components/ui/badge';
import { Upload } from 'lucide-react';

interface UploadDropzoneProps {
  onFileDrop: (files: File[]) => void;
}

export function UploadDropzone({ onFileDrop }: UploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileDrop,
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/*': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'video/mp4': ['.mp4'],
      'audio/mpeg': ['.mp3'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-300 ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:bg-blue-950/10'
      } `}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <motion.div
          className="mx-auto mb-4 h-16 w-16"
          animate={{
            y: isDragActive ? [0, -10, 0] : [0, -5, 0],
            scale: isDragActive ? [1, 1.1, 1] : [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-4 backdrop-blur-sm">
            <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          {isDragActive ? 'Drop files here' : 'Upload your files'}
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Drag & drop files here or click to browse
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
          <Badge variant="secondary">Images</Badge>
          <Badge variant="secondary">Documents</Badge>
          <Badge variant="secondary">Videos</Badge>
          <Badge variant="secondary">Audio</Badge>
          <Badge variant="secondary">Archives</Badge>
        </div>
        <p className="mt-2 text-xs text-gray-500">Max file size: 100MB</p>
      </div>
    </div>
  );
}
