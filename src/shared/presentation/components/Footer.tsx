export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔒</span>
              <span className="font-bold text-gray-900">UploadHaven</span>
            </div>
            <p className="text-sm text-gray-600">
              Privacy-first, zero-knowledge file sharing for everyone.
            </p>
          </div>

          {/* Privacy */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Privacy</h3>
            <div className="space-y-2 text-sm">
              <a href="/privacy" className="block text-gray-600 hover:text-gray-900">Privacy Policy</a>
              <a href="/security" className="block text-gray-600 hover:text-gray-900">Security</a>
              <a href="/transparency" className="block text-gray-600 hover:text-gray-900">Transparency Report</a>
            </div>
          </div>

          {/* Developers */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Developers</h3>
            <div className="space-y-2 text-sm">
              <a href="/docs" className="block text-gray-600 hover:text-gray-900">Documentation</a>
              <a href="/api" className="block text-gray-600 hover:text-gray-900">API Reference</a>
              <a href="https://github.com/uploadhaven/uploadhaven" className="block text-gray-600 hover:text-gray-900" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Community</h3>
            <div className="space-y-2 text-sm">
              <a href="/support" className="block text-gray-600 hover:text-gray-900">Support</a>
              <a href="/contribute" className="block text-gray-600 hover:text-gray-900">Contribute</a>
              <a href="/roadmap" className="block text-gray-600 hover:text-gray-900">Roadmap</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-500">
            © 2025 UploadHaven Community. Open source under MIT License.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>🌍 Self-hostable</span>
            <span>🔒 Zero-knowledge</span>
            <span>👤 Anonymous-first</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
