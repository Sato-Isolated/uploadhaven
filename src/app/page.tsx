import { ZeroKnowledgeUpload } from '@/domains/file-sharing/presentation/components/ZeroKnowledgeUpload';
import { PrivacyGuarantees } from '@/domains/privacy/presentation/components/PrivacyGuarantees';
import { Header } from '@/shared/presentation/components/Header';
import { Footer } from '@/shared/presentation/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              🔒 UploadHaven
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Privacy-first file sharing with zero-knowledge encryption.
              Your files are encrypted in your browser — the server cannot decrypt them.
            </p>

            {/* Privacy Guarantees */}
            <PrivacyGuarantees />
          </section>

          {/* Anonymous Upload Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Anonymous File Sharing
              </h2>
              <p className="text-gray-600">
                No registration required. Files auto-delete after expiration.
              </p>
            </div>

            <ZeroKnowledgeUpload />
          </section>

          {/* Features Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Zero-Knowledge Encryption
              </h3>
              <p className="text-sm text-gray-600">
                AES-256-GCM encryption happens in your browser. Server never sees your decryption keys.
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Anonymous by Default
              </h3>
              <p className="text-sm text-gray-600">
                No registration required. No tracking. No personal data collection.
              </p>
            </div>

            <div className="text-center p-6 bg-amber-50 rounded-lg">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Automatic Deletion
              </h3>
              <p className="text-sm text-gray-600">
                Files auto-delete after expiration. No permanent storage, no surveillance.
              </p>
            </div>
          </section>

          {/* Open Source Section */}
          <section className="text-center bg-blue-50 rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🌍 Open Source & Transparent
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              UploadHaven is fully open source. Audit the code, verify our privacy claims,
              and contribute to building the future of private file sharing.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="https://github.com/uploadhaven/uploadhaven"
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
              <a
                href="/docs"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📚 Documentation
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
