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
      className={className}
    >
      {t('copyLink')}
    </Button>
  );
}
