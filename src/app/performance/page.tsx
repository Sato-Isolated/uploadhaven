import { PerformanceTest } from '@/components/PerformanceTest';

export default function PerformanceTestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">TanStack Query Performance Test</h1>
        <p className="text-muted-foreground">
          Monitor and validate the performance of our TanStack Query implementation
        </p>
      </div>
      
      <PerformanceTest />
    </div>
  );
}
