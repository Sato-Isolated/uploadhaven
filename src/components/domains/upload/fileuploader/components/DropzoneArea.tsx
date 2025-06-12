// components/DropzoneArea.tsx - File drag & drop zone

'use client';

import { CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DropzoneProps } from '../types';

export default function DropzoneArea({
  isDragActive,
  getRootProps,
  getInputProps,
}: DropzoneProps) {
  return (
    <div
      {...getRootProps()}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
        isDragActive
          ? 'border-primary bg-primary/10 scale-105'
          : 'border-border hover:border-primary/60 hover:bg-primary/5 hover:scale-102'
      } `}
    >
      <input {...getInputProps()} />

      {/* Background gradient animation */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 transition-all duration-300 ${
          isDragActive ? 'opacity-100' : 'opacity-50'
        }`}
      />

      <div
        className={`transition-transform duration-300 ${
          isDragActive ? 'scale-110' : 'group-hover:scale-105'
        }`}
      >
        <CloudUpload
          className={`mx-auto mb-6 h-16 w-16 transition-colors ${
            isDragActive ? 'text-primary' : 'text-muted-foreground'
          }`}
        />
      </div>

      <div
        className={`transition-transform duration-300 ${
          isDragActive ? '-translate-y-2' : ''
        }`}
      >
        <Button
          size="lg"
          className="mb-4 border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700"
        >
          {isDragActive ? '🎯 Drop it here!' : '📁 Choose files to upload'}
        </Button>
        <p className="text-muted-foreground text-sm">
          {isDragActive
            ? 'Release to start uploading your files'
            : 'Drag & drop files here or click to browse'}
        </p>
        <p className="text-muted-foreground mt-2 text-xs opacity-75">
          Supports images, documents, videos, audio & archives
        </p>
      </div>
    </div>
  );
}
