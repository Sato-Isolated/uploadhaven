import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface FilePreviewErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

export function FilePreviewErrorState({
  error,
  onRetry,
}: FilePreviewErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-red-900">Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-red-700">
            {error?.message || 'An error occurred'}
          </p>
          <Button onClick={onRetry} variant="outline" className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
