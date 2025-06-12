import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SecurityEventsLoadingState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Security Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
            >
              <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
