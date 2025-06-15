import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FilePreviewClient from '@/components/domains/filepreview/FilePreviewClient';

type Props = {
  params: Promise<{ locale: string; shortUrl: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('FilePreview');

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function FilePreviewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return <FilePreviewClient />;
}
