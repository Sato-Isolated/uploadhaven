'use client';

import { useState, useEffect } from 'react';

export function DashboardClient() {
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement user session check and file loading
    // For now, show placeholder content
    setTimeout(() => {
      setUser({ email: 'user@example.com', name: 'Test User' });
      setFiles([]);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back{user?.name ? `, ${user.name}` : ''}
              </h1>
              <p className="text-gray-600">
                Manage your encrypted files securely
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">Zero-Knowledge Protected</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/"
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <div className="text-center space-y-2">
              <div className="text-3xl">📤</div>
              <h3 className="font-semibold">Upload New File</h3>
              <p className="text-sm text-blue-100">
                Share files with zero-knowledge encryption
              </p>
            </div>
          </a>

          <div className="bg-purple-600 text-white p-6 rounded-lg">
            <div className="text-center space-y-2">
              <div className="text-3xl">📁</div>
              <h3 className="font-semibold">My Files</h3>
              <p className="text-sm text-purple-100">
                {files.length} encrypted files stored
              </p>
            </div>
          </div>

          <div className="bg-amber-600 text-white p-6 rounded-lg">
            <div className="text-center space-y-2">
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold">Usage Stats</h3>
              <p className="text-sm text-amber-100">
                Privacy-preserving analytics
              </p>
            </div>
          </div>
        </div>

        {/* Files Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Files</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl">📁</div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No files yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload your first file to get started with secure sharing
                </p>
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔒 Upload First File
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📄</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <p className="text-sm text-gray-500">{file.size} • {file.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Encrypted
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Account Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account Type</label>
              <p className="text-gray-900">Free (Zero-Knowledge)</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
