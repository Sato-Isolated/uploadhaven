import { FileDownload } from '@/components/file-download';
import { notFound } from 'next/navigation';

interface SharePageProps {
  params: Promise<{
    id: string;
  }>;
}

// Function to check if share exists
async function checkShareExists(shareId: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/share/${shareId}`, {
      method: 'GET',
      cache: 'no-store', // Don't cache the response
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error checking share existence:', error);
    return false;
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  
  // Check if share exists, if not redirect to 404
  const shareExists = await checkShareExists(id);
  if (!shareExists) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8 fade-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <span className="font-tactical text-primary">Outer</span>
            <span className="text-foreground">Drop</span>
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Download Shared File
          </h2>
          <p className="text-muted-foreground">
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
