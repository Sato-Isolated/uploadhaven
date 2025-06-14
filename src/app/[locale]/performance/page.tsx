import { PerformanceTest } from '@/components/domains/admin/performance/PerformanceTest';

export default function PerformanceTestPage() {
  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">TanStack Query Performance Test</h1>
        <p className="text-muted-foreground">
          Monitor and validate the performance of our TanStack Query
          implementation
        </p>
      </div>

      <PerformanceTest />
    </div>
  );
}
