import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"
            >
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
