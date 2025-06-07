// components/DropzoneArea.tsx - File drag & drop zone

"use client";

import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DropzoneProps } from "../types";

export default function DropzoneArea({
  isDragActive,
  getRootProps,
  getInputProps,
}: DropzoneProps) {
  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer 
        transition-all duration-300 overflow-hidden group
        ${
          isDragActive
            ? "border-primary bg-primary/10 scale-105"
            : "border-border hover:border-primary/60 hover:bg-primary/5 hover:scale-102"
        }
      `}
    >
      <input {...getInputProps()} />

      {/* Background gradient animation */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-2xl transition-all duration-300 ${
          isDragActive ? "opacity-100" : "opacity-50"
        }`}
      />

      <div
        className={`transition-transform duration-300 ${
          isDragActive ? "scale-110" : "group-hover:scale-105"
        }`}
      >
        <CloudUpload
          className={`mx-auto h-16 w-16 mb-6 transition-colors ${
            isDragActive ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </div>

      <div
        className={`transition-transform duration-300 ${
          isDragActive ? "-translate-y-2" : ""
        }`}
      >
        <Button
          size="lg"
          className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
        >
          {isDragActive ? "🎯 Drop it here!" : "📁 Choose files to upload"}
        </Button>
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? "Release to start uploading your files"
            : "Drag & drop files here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-2 opacity-75">
          Supports images, documents, videos, audio & archives
        </p>
      </div>
    </div>
  );
}
