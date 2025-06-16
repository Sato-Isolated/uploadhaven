'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface CopyLinkButtonProps {
  filename: string;
  className?: string;
}

export default function CopyLinkButton({
  filename,
  className,
}: CopyLinkButtonProps) {
  const t = useTranslations('Dashboard');

  const handleCopyLink = () => {
    const link = `${window.location.origin}/api/files/${filename}`;
    navigator.clipboard.writeText(link);
    toast.success(t('linkCopiedToClipboard', { label: t('link') }));
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopyLink}
      className={`border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${className || ''}`}
    >
      {t('copyLink')}
    </Button>
  );
}
