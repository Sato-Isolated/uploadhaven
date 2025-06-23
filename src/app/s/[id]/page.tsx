import { AnonymousDownload } from '@/domains/file-sharing/presentation/components/AnonymousDownload';
import { Header } from '@/shared/presentation/components/Header';
import { Footer } from '@/shared/presentation/components/Footer';
import { PrivacyGuarantees } from '@/domains/privacy/presentation/components/PrivacyGuarantees';

interface FilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FilePage({ params }: FilePageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Privacy Guarantees */}
          <PrivacyGuarantees />

          {/* Download Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🔐 Secure File Download
              </h1>
              <p className="text-gray-600">
                File is encrypted. Decryption happens in your browser only.
              </p>
            </div>

            <AnonymousDownload fileId={id} />
          </section>

          {/* Security Information */}
          <section className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="text-center space-y-3">
              <h2 className="text-lg font-semibold text-blue-900">
                🛡️ Zero-Knowledge Security
              </h2>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  • Files are encrypted with AES-256-GCM in the sender's browser
                </p>
                <p>
                  • Decryption keys are never sent to our servers
                </p>
                <p>
                  • Only you can decrypt and view the file content
                </p>
                <p>
                  • Files automatically delete after expiration
                </p>
              </div>
            </div>
          </section>

          {/* Upload Your Own */}
          <section className="text-center bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Share Your Own Files Securely
            </h2>
            <p className="text-gray-600 mb-4">
              Upload files anonymously with zero-knowledge encryption
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔒 Upload Anonymously
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
