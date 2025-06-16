'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useFileOperations } from '@/hooks';
import { useTranslations } from 'next-intl';

interface DeleteFileButtonProps {
  filename: string;
  fileName: string;
}

export default function DeleteFileButton({
  filename,
  fileName,
}: DeleteFileButtonProps) {
  const router = useRouter();
  const { deleteFile, deleting: isDeleting } = useFileOperations();
  const t = useTranslations('Common');

  const handleDelete = async () => {
    if (
      !confirm(
        t('deleteFileConfirmation', { fileName })
      )
    ) {
      return;
    }

    await deleteFile(filename, {
      onSuccess: () => {
        toast.success(t('fileDeletedSuccessfully'));
        router.refresh();
      },
      onError: (error) => {
        toast.error(error || t('failedToDeleteFile'));
      },
    });
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-red-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? t('deleting') : t('delete')}
    </Button>
  );
}
