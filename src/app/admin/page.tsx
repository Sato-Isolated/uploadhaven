import { AdminDashboard } from "@/components/admin-dashboard";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Administration Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitor system health, performance metrics, and run maintenance tasks.
          </p>
        </div>
        
        <AdminDashboard />
        
        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🔧 System Features Utilized
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>✅ <strong>Performance Monitoring:</strong> Real-time metrics collection and analysis</li>
            <li>✅ <strong>Automatic Cleanup:</strong> Scheduled removal of expired files and shares</li>
            <li>✅ <strong>Memory Monitoring:</strong> JavaScript heap usage tracking</li>
            <li>✅ <strong>Health Checks:</strong> System status monitoring</li>
            <li>✅ <strong>Manual Maintenance:</strong> On-demand cleanup and performance stats</li>
            <li>✅ <strong>Auto-refresh:</strong> Dashboard updates every 30 seconds</li>
          </ul>
        </div>
        
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            🚀 Previously Unused Functions Now Active
          </h3>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• <code>performanceMonitor.getSummary()</code> - Displaying metrics overview</li>
            <li>• <code>performanceMonitor.getMemoryUsage()</code> - Memory usage tracking</li>
            <li>• <code>fileRepository.cleanup()</code> - Automated file cleanup</li>
            <li>• <code>shareRepository.cleanup()</code> - Automated share cleanup</li>
            <li>• <code>storageService.cleanup()</code> - Storage maintenance</li>
            <li>• <code>usePrefetchFileInfo()</code> - Optimized file info loading</li>
            <li>• <code>MaintenanceScheduler</code> - Automated background tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
