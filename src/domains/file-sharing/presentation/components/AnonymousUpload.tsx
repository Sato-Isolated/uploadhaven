'use client';

import { useState } from 'react';
import { useAnonymousUpload } from '../hooks/useAnonymousUpload';

interface AnonymousUploadProps {
  onUploadComplete?: (result: { shareUrl: string; fileId: string }) => void;
}

export function AnonymousUpload({ onUploadComplete }: AnonymousUploadProps = {}) {
  const { uploadFile, isUploading, progress, error, result, resetUpload } = useAnonymousUpload();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enablePasswordProtection, setEnablePasswordProtection] = useState(false);
  const [expiration, setExpiration] = useState('24');
  const [maxDownloads, setMaxDownloads] = useState('');
  const [enableDownloadLimit, setEnableDownloadLimit] = useState(false);
  const [fileError, setFileError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear previous errors
      setFileError('');

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        setFileError('File too large. Maximum size is 100MB.');
        return;
      }
      setSelectedFile(file);
      resetUpload();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const uploadOptions: {
        enablePasswordProtection?: boolean;
        ttlHours?: number;
        maxDownloads?: number;
      } = {
        enablePasswordProtection,
        ttlHours: parseInt(expiration),
      };

      // Only add maxDownloads if the option is enabled and has a value
      if (enableDownloadLimit && maxDownloads && parseInt(maxDownloads) > 0) {
        uploadOptions.maxDownloads = parseInt(maxDownloads);
      }

      const uploadResult = await uploadFile(selectedFile, uploadOptions);

      if (uploadResult && onUploadComplete) {
        onUploadComplete(uploadResult);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleTryAgain = () => {
    resetUpload();
  };

  // Success state
  if (result) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-green-600 mb-2">Upload Successful!</h3>
          <p className="text-gray-600">Your file has been encrypted and uploaded securely.</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h4 className="font-semibold text-green-800 mb-3">Share this link:</h4>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={result.shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
            />
            <button
              onClick={() => copyToClipboard(result.shareUrl)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-green-700 mt-2">
            🔑 The encryption key is in the URL after #. Keep it secret.
          </p>

          {/* Display generated password if protection was enabled */}
          {result.generatedPassword && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h5 className="font-semibold text-yellow-800 mb-2">🔒 Generated Password:</h5>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-2 py-1 bg-white border border-yellow-300 rounded text-sm font-mono">
                  {result.generatedPassword}
                </code>
                <button
                  onClick={() => copyToClipboard(result.generatedPassword!)}
                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                ⚠️ Save this password - recipients will need it to download the file.
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              setSelectedFile(null);
              resetUpload();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Another File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Anonymous File Sharing</h1>
        <p className="text-gray-600">
          Files are encrypted in your browser using zero-knowledge encryption.
          The server cannot decrypt your files.
        </p>

        {/* Privacy Indicators */}
        <div className="flex justify-center space-x-4">
          <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-md">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-sm font-medium">Zero-Knowledge</span>
          </div>
          <div className="flex items-center space-x-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-md">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span className="text-sm font-medium">Anonymous</span>
          </div>
          <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-md">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="text-sm font-medium">Temporary</span>
          </div>
        </div>
      </div>

      {/* Drop Zone Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div>
            <p className="text-lg text-gray-900">Drop files here or click to upload</p>
            <p className="text-sm text-gray-500">Maximum 100MB • Files are encrypted in your browser</p>
          </div>
        </div>
      </div>

      {/* File Input (Hidden) */}
      <input
        id="file-input"
        type="file"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        aria-label="Choose files to upload"
      />

      {/* File Error Display */}
      {fileError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{fileError}</p>
        </div>
      )}

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">        {/* Random Password Protection */}
        <div>
          <label htmlFor="enable-password" className="block text-sm font-medium text-gray-700 mb-2">
            🔒 Password Protection
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="enable-password"
              type="checkbox"
              checked={enablePasswordProtection}
              onChange={(e) => setEnablePasswordProtection(e.target.checked)}
              disabled={isUploading}
              className="rounded"
            />
            <label htmlFor="enable-password" className="text-sm text-gray-600">
              Generate random password
            </label>
          </div>
          {enablePasswordProtection && (
            <p className="text-xs text-blue-600 mt-1">
              ℹ️ A secure password will be generated automatically
            </p>
          )}
        </div>

        {/* Auto-delete */}
        <div>
          <label htmlFor="expiration-select" className="block text-sm font-medium text-gray-700 mb-2">
            Auto-delete after
          </label>
          <select
            id="expiration-select"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            disabled={isUploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1">1 hour</option>
            <option value="24">24 hours</option>
            <option value="168">7 days</option>
            <option value="720">30 days</option>
          </select>
        </div>

        {/* Maximum Downloads (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📊 Download Limit
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                id="enable-download-limit"
                type="checkbox"
                checked={enableDownloadLimit}
                onChange={(e) => setEnableDownloadLimit(e.target.checked)}
                disabled={isUploading}
                className="rounded"
              />
              <label htmlFor="enable-download-limit" className="text-sm text-gray-600">
                Limit downloads
              </label>
            </div>
            {enableDownloadLimit && (
              <input
                id="downloads-input"
                type="number"
                min="1"
                max="1000"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                disabled={isUploading}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Maximum number of downloads"
              />
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Encrypting file... 🔒</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">Upload failed: Network error</p>
          <button
            onClick={handleTryAgain}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Encrypting & Uploading...
          </span>
        ) : (
          '🔒 Upload Anonymously'
        )}
      </button>
    </div>
  );
}
