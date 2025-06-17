'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { FilePreviewData, BaseComponentProps } from '@/types';

interface PDFPreviewProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function PDFPreview({ file }: PDFPreviewProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const isBlob = file.url?.startsWith('blob:');
  
  // Debug: Log PDF preview info
  console.log('📄 PDF PREVIEW DEBUG:', {
    filename: file.filename,
    originalName: file.originalName,
    type: file.type,
    url: file.url,
    urlType: isBlob ? 'blob' : 'api',
  });

  // For blob URLs, show fallback after a short delay if embed doesn't load
  useEffect(() => {
    if (isBlob && !embedLoaded) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 3000); // Show fallback after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isBlob, embedLoaded]);

  const handleOpenInNewTab = () => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const handleDownload = () => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Show fallback for blob URLs that don't load properly
  if (isBlob && showFallback && !embedLoaded) {
    return (
      <motion.div
        className="flex h-[500px] w-full items-center justify-center rounded bg-gray-100 dark:bg-gray-800"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            PDF Ready for Viewing
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Your decrypted PDF is ready. Use the buttons below to view or download it.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleOpenInNewTab}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in New Tab
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="h-[500px] w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {isBlob ? (
        // For blob URLs (decrypted files), try embed first
        <>
          <embed
            src={file.url}
            type="application/pdf"
            className="h-full w-full rounded shadow-lg dark:shadow-gray-700/30"
            title={file.originalName}
            onLoad={() => setEmbedLoaded(true)}
            onError={() => setShowFallback(true)}
          />
          {!embedLoaded && !showFallback && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
              </div>
            </div>
          )}
        </>
      ) : (
        // For regular URLs, use iframe
        <iframe
          src={file.url}
          className="h-full w-full rounded shadow-lg dark:shadow-gray-700/30"
          title={file.originalName}
        />
      )}
    </motion.div>
  );
}
