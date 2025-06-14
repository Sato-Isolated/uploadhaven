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
export const createFeatureItems = (
  t: (key: string) => string
): FeatureItem[] => [
  {
    icon: React.createElement(FileIcon, {
      className: 'h-5 w-5 text-blue-600 dark:text-blue-400',
    }),
    title: t('dragDropUpload'),
    description: t('dragDropDescription'),
    iconBgColor: 'bg-blue-100 dark:bg-blue-900',
    delay: 0.2,
  },
  {
    icon: React.createElement(ShareIcon, {
      className: 'h-5 w-5 text-green-600 dark:text-green-400',
    }),
    title: t('instantSharing'),
    description: t('instantSharingDescription'),
    iconBgColor: 'bg-green-100 dark:bg-green-900',
    delay: 0.25,
  },
  {
    icon: React.createElement(ShieldIcon, {
      className: 'h-5 w-5 text-purple-600 dark:text-purple-400',
    }),
    title: t('securePrivate'),
    description: t('securePrivateDescription'),
    iconBgColor: 'bg-purple-100 dark:bg-purple-900',
    delay: 0.3,
  },
  {
    icon: React.createElement(Clock, {
      className: 'h-5 w-5 text-orange-600 dark:text-orange-400',
    }),
    title: t('flexibleExpiration'),
    description: t('flexibleExpirationDescription'),
    iconBgColor: 'bg-orange-100 dark:bg-orange-900',
    delay: 0.35,
  },
  {
    icon: React.createElement(ZapIcon, {
      className: 'h-5 w-5 text-yellow-600 dark:text-yellow-400',
    }),
    title: t('fastReliable'),
    description: t('fastReliableDescription'),
    iconBgColor: 'bg-yellow-100 dark:bg-yellow-900',
    delay: 0.4,
  },
];

// Create upload limit items data
export const createUploadLimitItems = (
  t: (key: string) => string
): UploadLimitItem[] => [
  {
    label: t('maximumFileSize'),
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
export const createSupportedFormats = (
  t: (key: string) => string
): SupportedFormat[] => [
  {
    name: t('images'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    name: t('videos'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    name: t('audio'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    name: t('documents'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
];

// Create expiration options data
export const createExpirationOptions = (
  t: (key: string) => string
): ExpirationOption[] => [
  {
    label: t('oneHour'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    label: t('twentyFourHours'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    label: t('sevenDays'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    label: t('thirtyDays'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    label: t('never'),
    color:
      'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
];

// Create supported file types data
export const createSupportedTypes = (t: (key: string) => string) => [
  { name: t('images'), extensions: t('imagesExtensions') },
  { name: t('documents'), extensions: t('documentsExtensions') },
  { name: t('archives'), extensions: t('archivesExtensions') },
  { name: t('video'), extensions: t('videoExtensions') },
  { name: t('audio'), extensions: t('audioExtensions') },
];

// Create API endpoints data
export const createApiEndpoints = (
  t: (key: string) => string
): ApiEndpoint[] => [
  {
    title: t('uploadEndpoint'),
    endpoint: 'POST /api/upload',
    description: t('uploadEndpointDescription'),
    delay: 0.4,
  },
  {
    title: t('downloadEndpoint'),
    endpoint: 'GET /api/files/[filename]',
    description: t('downloadEndpointDescription'),
    delay: 0.45,
  },
];

// Create FAQ items data
export const createFaqItems = (t: (key: string) => string): FaqItem[] => [
  {
    question: t('faqStorageQuestion'),
    answer: t('faqStorageAnswer'),
    delay: 0.5,
  },
  {
    question: t('faqLimitQuestion'),
    answer: t('faqLimitAnswer'),
    delay: 0.55,
  },
  {
    question: t('faqDeleteQuestion'),
    answer: t('faqDeleteAnswer'),
    delay: 0.6,
  },
  {
    question: t('faqOpenSourceQuestion'),
    answer: t('faqOpenSourceAnswer'),
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
