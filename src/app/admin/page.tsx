import { AdminDashboard } from "@/components/admin-dashboard";
import { isCurrentUserAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect("/access-denied");
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 fade-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <span className="font-tactical text-primary">Outer</span>
            <span className="text-foreground">Drop</span>
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Administration Panel
          </h2>
          <p className="text-muted-foreground">
            Monitor system health, performance metrics, and run maintenance tasks.
          </p>
        </div>
        
        <AdminDashboard />
        
        {/* Additional Info */}
        <div className="mt-8 tactical-card p-4 border-primary">
          <h3 className="text-lg font-semibold text-primary mb-2 font-tactical">
            🔧 System Features Utilized
          </h3>
          <ul className="text-sm text-foreground space-y-1">
            <li>✅ <strong>Performance Monitoring:</strong> Real-time metrics collection and analysis</li>
            <li>✅ <strong>Automatic Cleanup:</strong> Scheduled removal of expired files and shares</li>
            <li>✅ <strong>Memory Monitoring:</strong> JavaScript heap usage tracking</li>
            <li>✅ <strong>Health Checks:</strong> System status monitoring</li>
            <li>✅ <strong>Manual Maintenance:</strong> On-demand cleanup and performance stats</li>
            <li>✅ <strong>Auto-refresh:</strong> Dashboard updates every 30 seconds</li>
          </ul>
        </div>
        
        <div className="mt-4 tactical-card p-4 border-success">
          <h3 className="text-lg font-semibold text-success mb-2 font-tactical">
            🚀 Previously Unused Functions Now Active
          </h3>
          <ul className="text-sm text-foreground space-y-1">
            <li>• <code className="font-tactical text-primary">performanceMonitor.getSummary()</code> - Displaying metrics overview</li>
            <li>• <code className="font-tactical text-primary">performanceMonitor.getMemoryUsage()</code> - Memory usage tracking</li>
            <li>• <code className="font-tactical text-primary">fileRepository.cleanup()</code> - Automated file cleanup</li>
            <li>• <code className="font-tactical text-primary">shareRepository.cleanup()</code> - Automated share cleanup</li>
            <li>• <code className="font-tactical text-primary">storageService.cleanup()</code> - Storage maintenance</li>
            <li>• <code className="font-tactical text-primary">usePrefetchFileInfo()</code> - Optimized file info loading</li>
            <li>• <code className="font-tactical text-primary">MaintenanceScheduler</code> - Automated background tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
