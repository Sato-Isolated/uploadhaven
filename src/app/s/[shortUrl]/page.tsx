import { Metadata } from 'next';
import FilePreviewClient from '@/components/domains/filepreview/FilePreviewClient';

export const metadata: Metadata = {
  title: 'File Preview - UploadHaven',
  description:
    'Preview and download files securely with UploadHaven. View file details before downloading.',
};

export default function FilePreviewPage() {
  return <FilePreviewClient />;
}
