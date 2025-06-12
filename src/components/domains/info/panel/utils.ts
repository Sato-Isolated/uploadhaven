import React from 'react';
import { FileIcon, ShieldIcon, ZapIcon, ShareIcon, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  FeatureItem,
  UploadLimitItem,
  ApiEndpoint,
  FaqItem,
  SupportedFormat,
  ExpirationOption,
} from './types';

// Create feature items data
export const createFeatureItems = (): FeatureItem[] => [
  {
    icon: React.createElement(FileIcon, {
      className: 'h-5 w-5 text-blue-600 dark:text-blue-400',
    }),
    title: 'Drag & Drop Upload',
    description: 'Simply drag files or click to select multiple files at once',
    iconBgColor: 'bg-blue-100 dark:bg-blue-900',
    delay: 0.2,
  },
  {
    icon: React.createElement(ShareIcon, {
      className: 'h-5 w-5 text-green-600 dark:text-green-400',
    }),
    title: 'Instant Sharing',
    description: 'Get shareable links immediately after upload',
    iconBgColor: 'bg-green-100 dark:bg-green-900',
    delay: 0.25,
  },
  {
    icon: React.createElement(ShieldIcon, {
      className: 'h-5 w-5 text-purple-600 dark:text-purple-400',
    }),
    title: 'Secure & Private',
    description: 'Files are validated and stored securely',
    iconBgColor: 'bg-purple-100 dark:bg-purple-900',
    delay: 0.3,
  },
  {
    icon: React.createElement(Clock, {
      className: 'h-5 w-5 text-orange-600 dark:text-orange-400',
    }),
    title: 'Flexible Expiration',
    description: 'Choose when your files expire - from 1 hour to never',
    iconBgColor: 'bg-orange-100 dark:bg-orange-900',
    delay: 0.35,
  },
  {
    icon: React.createElement(ZapIcon, {
      className: 'h-5 w-5 text-yellow-600 dark:text-yellow-400',
    }),
    title: 'Fast & Reliable',
    description: 'Built with Next.js for optimal performance',
    iconBgColor: 'bg-yellow-100 dark:bg-yellow-900',
    delay: 0.4,
  },
];

// Create upload limit items data
export const createUploadLimitItems = (): UploadLimitItem[] => [
  {
    label: 'Maximum file size',
    value: React.createElement(
      Badge,
      {
        variant: 'secondary',
        className:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      },
      '100 MB'
    ),
    delay: 0.3,
  },
];

// Create supported formats data
export const createSupportedFormats = (): SupportedFormat[] => [
  {
    name: 'Images',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    name: 'Videos',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    name: 'Audio',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    name: 'Documents',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
];

// Create expiration options data
export const createExpirationOptions = (): ExpirationOption[] => [
  {
    label: '1 Hour',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    label: '24 Hours',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    label: '7 Days',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    label: '30 Days',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    label: 'Never',
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
];

// Create supported file types data
export const createSupportedTypes = () => [
  { name: 'Images', extensions: 'JPEG, PNG, GIF, WebP' },
  { name: 'Documents', extensions: 'PDF, TXT' },
  { name: 'Archives', extensions: 'ZIP' },
  { name: 'Video', extensions: 'MP4' },
  { name: 'Audio', extensions: 'MP3' },
];

// Create API endpoints data
export const createApiEndpoints = (): ApiEndpoint[] => [
  {
    title: 'Upload Endpoint',
    endpoint: 'POST /api/upload',
    description:
      "Send files via multipart/form-data with the field name 'file'",
    delay: 0.4,
  },
  {
    title: 'Download Endpoint',
    endpoint: 'GET /api/files/[filename]',
    description: 'Access uploaded files directly via their filename',
    delay: 0.45,
  },
];

// Create FAQ items data
export const createFaqItems = (): FaqItem[] => [
  {
    question: 'How long are files stored?',
    answer:
      'Files are currently stored indefinitely. Future versions will include automatic cleanup options.',
    delay: 0.5,
  },
  {
    question: 'Is there a file count limit?',
    answer:
      'No, you can upload as many files as you need, as long as each file is under 100MB.',
    delay: 0.55,
  },
  {
    question: 'Can I delete uploaded files?',
    answer:
      'Files are tracked locally in your browser. You can remove them from your file list, but the actual files remain on the server.',
    delay: 0.6,
  },
  {
    question: 'Is UploadHaven open source?',
    answer:
      'Yes! UploadHaven is fully open source. You can find the code on GitHub.',
    delay: 0.65,
  },
];

// Create example curl command
export const createExampleCommand = (): string => {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://your-domain.com';
  return `curl -X POST -F "file=@image.jpg" ${origin}/api/upload`;
};
