import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import FilePreviewClient from '@/components/domains/filepreview/FilePreviewClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('FilePreview');

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default function FilePreviewPage() {
  return <FilePreviewClient />;
}
