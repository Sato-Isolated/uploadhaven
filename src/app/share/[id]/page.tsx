import { FileDownload } from '@/components/file-download';

interface SharePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Download Shared File
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            File is encrypted and will be decrypted in your browser
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <FileDownload shareId={id} />
        </div>
      </div>
    </div>
  );
}
