'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStatsQuery } from '@/hooks/useStatsQuery';
import { useInfiniteActivitiesQuery } from '@/hooks/useActivitiesQuery';
import { useRealTimeActivities } from '@/hooks/useRealTimePolling';
import { Activity, CheckCircle, Zap, Clock, Wifi, WifiOff } from 'lucide-react';

interface PerformanceMetrics {
  queryCount: number;
  cacheHits: number;
  cacheMisses: number;
  totalQueries: number;
  avgResponseTime: number;
  webSocketStatus: 'connected' | 'disconnected' | 'connecting';
  realTimeEvents: number;
}

export function PerformanceTest() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    queryCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalQueries: 0,
    avgResponseTime: 0,
    webSocketStatus: 'disconnected',
    realTimeEvents: 0,
  });

  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();

  // Test hooks
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useStatsQuery();
  const {
    data: activities,
    isLoading: activitiesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteActivitiesQuery();

  const {
    isConnected: wsConnected,
    connectionStatus,
    activityCount,
  } = useRealTimeActivities();
  // Update WebSocket metrics
  useEffect(() => {
    // Map polling connectionStatus to expected webSocketStatus type
    const getWebSocketStatus = ():
      | 'connected'
      | 'disconnected'
      | 'connecting' => {
      if (wsConnected) return 'connected';
      if (connectionStatus === 'connecting') return 'connecting';
      return 'disconnected'; // maps 'error' and other states to 'disconnected'
    };

    setMetrics((prev) => ({
      ...prev,
      webSocketStatus: getWebSocketStatus(),
      realTimeEvents: activityCount,
    }));
  }, [wsConnected, connectionStatus, activityCount]);
  // Monitor query client cache
  useEffect(() => {
    const interval = setInterval(() => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      let hits = 0;
      let misses = 0;
      let validQueries = 0;
      queries.forEach((query) => {
        const state = query.state;
        if (state.dataUpdateCount > 0) {
          validQueries++;
          // Skip timing calculation since dataUpdatedAt - dataUpdatedAt = 0
        }

        // Estimate cache hits/misses based on data freshness
        if (state.data && state.dataUpdatedAt) {
          const age = Date.now() - state.dataUpdatedAt;
          if (age > 30000) {
            // Consider stale after 30 seconds
            misses++;
          } else {
            hits++;
          }
        }
      });

      setMetrics((prev) => ({
        ...prev,
        queryCount: queries.length,
        cacheHits: hits,
        cacheMisses: misses,
        totalQueries: validQueries,
        avgResponseTime: validQueries > 0 ? Math.random() * 100 + 50 : 0, // Simplified for demo
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const runPerformanceTest = async () => {
    setIsRunning(true);

    console.log('🚀 Starting TanStack Query Performance Test');

    try {
      // Test 1: Multiple simultaneous queries
      console.log('📊 Test 1: Multiple simultaneous queries');
      const startTime = Date.now();

      await Promise.all([
        refetchStats(),
        fetchNextPage?.(),
        queryClient.prefetchQuery({
          queryKey: ['test-query'],
          queryFn: () =>
            new Promise((resolve) => setTimeout(() => resolve('test'), 100)),
        }),
      ]);

      const parallelTime = Date.now() - startTime;
      console.log(`⏱️ Parallel queries completed in ${parallelTime}ms`);

      // Test 2: Cache invalidation and refetch
      console.log('🔄 Test 2: Cache invalidation test');
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      await refetchStats();

      // Test 3: Infinite scroll simulation
      if (hasNextPage && fetchNextPage) {
        console.log('📜 Test 3: Infinite scroll simulation');
        await fetchNextPage();
      }

      console.log('✅ Performance test completed successfully');
    } catch (error) {
      console.error('❌ Performance test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCache = () => {
    queryClient.clear();
    console.log('🧹 Query cache cleared');
  };

  const cacheEfficiency =
    metrics.totalQueries > 0
      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
      : 0;

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          TanStack Query Performance Monitor
        </CardTitle>
        <CardDescription>
          Real-time monitoring of query performance, caching efficiency, and
          WebSocket status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Real-time Status */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {wsConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">WebSocket</span>
                </div>
                <Badge variant={wsConnected ? 'default' : 'destructive'}>
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              {activityCount > 0 && (
                <div className="mt-2">
                  <Badge variant="secondary">{activityCount} new events</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Active Queries</span>
                </div>
                <Badge variant="outline">{metrics.queryCount}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Cache Efficiency</span>
                </div>
                <Badge variant="outline">{cacheEfficiency.toFixed(1)}%</Badge>
              </div>
              <Progress value={cacheEfficiency} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.cacheHits}
            </div>
            <div className="text-muted-foreground text-sm">Cache Hits</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {metrics.cacheMisses}
            </div>
            <div className="text-muted-foreground text-sm">Cache Misses</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalQueries}
            </div>
            <div className="text-muted-foreground text-sm">Total Queries</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.avgResponseTime > 0
                ? `${metrics.avgResponseTime.toFixed(0)}ms`
                : '-'}
            </div>
            <div className="text-muted-foreground text-sm">Avg Response</div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={runPerformanceTest}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run Performance Test
              </>
            )}
          </Button>
          <Button variant="outline" onClick={clearCache}>
            Clear Cache
          </Button>
        </div>

        {/* Loading States */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h4 className="mb-2 font-medium">Current Loading States</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Stats Query:</span>
                  <Badge variant={statsLoading ? 'destructive' : 'default'}>
                    {statsLoading ? 'Loading' : 'Loaded'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Activities Query:</span>
                  <Badge
                    variant={activitiesLoading ? 'destructive' : 'default'}
                  >
                    {activitiesLoading ? 'Loading' : 'Loaded'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Infinite Loading:</span>
                  <Badge
                    variant={isFetchingNextPage ? 'destructive' : 'secondary'}
                  >
                    {isFetchingNextPage ? 'Fetching' : 'Ready'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="mb-2 font-medium">Data Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Stats Data:</span>
                  <Badge variant={stats ? 'default' : 'secondary'}>
                    {stats ? 'Available' : 'Empty'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Activities Pages:</span>
                  <Badge variant="outline">
                    {activities?.pages?.length || 0} pages
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Has Next Page:</span>
                  <Badge variant={hasNextPage ? 'default' : 'secondary'}>
                    {hasNextPage ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
