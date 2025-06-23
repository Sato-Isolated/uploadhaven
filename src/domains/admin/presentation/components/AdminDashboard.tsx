'use client';

import { useState, useEffect } from 'react';

interface AdminStats {
  totalFiles: number;
  totalUsers: number;
  totalStorage: string;
  activeUploads: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load users from DDD admin API endpoint
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData.users || []);
        setStats({
          totalFiles: 0, // TODO: Implement file counting
          totalUsers: userData.users?.length || 0,
          totalStorage: '0 MB', // TODO: Implement storage calculation
          activeUploads: 0, // TODO: Implement active upload tracking
        });
      } else {
        console.error('Failed to load admin data');
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🔧 Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Privacy-preserving platform administration
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm font-medium text-red-800">Admin Access</span>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-600 text-white p-6 rounded-lg">
              <div className="text-center space-y-2">
                <div className="text-3xl">📁</div>
                <h3 className="font-semibold">Total Files</h3>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
              </div>
            </div>

            <div className="bg-purple-600 text-white p-6 rounded-lg">
              <div className="text-center space-y-2">
                <div className="text-3xl">👥</div>
                <h3 className="font-semibold">Total Users</h3>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="bg-green-600 text-white p-6 rounded-lg">
              <div className="text-center space-y-2">
                <div className="text-3xl">💾</div>
                <h3 className="font-semibold">Storage Used</h3>
                <p className="text-2xl font-bold">{stats.totalStorage}</p>
              </div>
            </div>

            <div className="bg-amber-600 text-white p-6 rounded-lg">
              <div className="text-center space-y-2">
                <div className="text-3xl">📤</div>
                <h3 className="font-semibold">Active Uploads</h3>
                <p className="text-2xl font-bold">{stats.activeUploads}</p>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-yellow-600">🛡️</span>
            <span className="font-medium text-yellow-800">Privacy-Preserving Administration</span>
          </div>
          <p className="text-sm text-yellow-700">
            This admin panel shows only privacy-safe metadata. File contents remain encrypted and invisible to administrators.
            Zero-knowledge principles are maintained even for admin functions.
          </p>
        </div>

        {/* Users Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <button
              onClick={loadAdminData}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="text-4xl">👥</div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-gray-600">
                  User accounts will appear here when created
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="pb-3 text-sm font-semibold text-gray-900">User</th>
                    <th className="pb-3 text-sm font-semibold text-gray-900">Role</th>
                    <th className="pb-3 text-sm font-semibold text-gray-900">Created</th>
                    <th className="pb-3 text-sm font-semibold text-gray-900">Status</th>
                    <th className="pb-3 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name || 'Anonymous User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-blue-600 hover:text-blue-700 text-sm mr-3">
                          View
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm">
                          Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Encryption Service</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                📊 Generate Report
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                🧹 Cleanup Expired Files
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                🔐 Security Audit
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                ⚙️ System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
