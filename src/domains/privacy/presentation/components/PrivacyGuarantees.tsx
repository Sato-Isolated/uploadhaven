export function PrivacyGuarantees() {
  return (
    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">Zero-Knowledge</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
            <span className="text-sm font-medium text-purple-800">Anonymous</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-sm font-medium text-amber-800">Temporary</span>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-700 font-medium">
          🛡️ Privacy Guaranteed by Design
        </p>
        <p className="text-xs text-gray-600">
          Client-side encryption • No registration required • Auto-deletion • Open source
        </p>
      </div>
    </div>
  );
}
