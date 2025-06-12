'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanResult } from '@/types/security';

interface ScanResultsProps {
  scanResults: ScanResult[];
}

const getStatusIcon = (status: 'clean' | 'threat' | 'warning') => {
  switch (status) {
    case 'threat':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'clean':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <CheckCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: 'clean' | 'threat' | 'warning') => {
  switch (status) {
    case 'threat':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'clean':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export function ScanResults({ scanResults }: ScanResultsProps) {
  if (scanResults.length === 0) return null;

  const threatsCount = scanResults.filter((r) => r.status === 'threat').length;
  const warningsCount = scanResults.filter(
    (r) => r.status === 'warning'
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Scan Results</CardTitle>
        <CardDescription>
          Found {scanResults.length} items ({threatsCount} threats,{' '}
          {warningsCount} warnings)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {scanResults.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                {getStatusIcon(result.status)}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{result.type}</span>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {result.message}
                  </p>
                  {result.details && (
                    <p className="mt-1 text-xs text-gray-500">
                      {result.details}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {result.timestamp.toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
