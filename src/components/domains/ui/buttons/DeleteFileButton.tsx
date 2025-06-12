'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useFileOperations } from '@/hooks';

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

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    await deleteFile(filename, {
      onSuccess: () => {
        toast.success('File deleted successfully');
        router.refresh();
      },
      onError: (error) => {
        toast.error(error || 'Failed to delete file');
      },
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:text-red-700"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
