'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { ApiInfoProps } from '../types';

export default function ApiInfoSection({
  endpoints,
  exampleCommand,
}: ApiInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-100 dark:border-purple-800 dark:from-purple-950 dark:to-violet-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-violet-400">
              API Access
            </span>
          </CardTitle>
          <CardDescription className="text-purple-600 dark:text-purple-400">
            Programmatic access to UploadHaven
          </CardDescription>
        </CardHeader>
        <CardContent>
          {' '}
          <div className="space-y-6">
            {' '}
            {endpoints.map((endpoint, index) => (
              <motion.div
                key={`endpoint-${endpoint.title}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: endpoint.delay }}
              >
                <h4 className="mb-3 font-semibold text-purple-900 dark:text-purple-100">
                  {endpoint.title}
                </h4>
                <div className="rounded-lg bg-purple-100 p-4 backdrop-blur-sm dark:bg-purple-900">
                  <code className="font-mono text-sm text-purple-800 dark:text-purple-200">
                    {endpoint.endpoint}
                  </code>
                </div>
                <p className="mt-3 text-sm text-purple-700 dark:text-purple-300">
                  {endpoint.description}
                </p>
              </motion.div>
            ))}
            {/* Example Usage */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <h4 className="mb-3 font-semibold text-purple-900 dark:text-purple-100">
                Example Usage
              </h4>
              <div className="rounded-lg bg-purple-100 p-4 backdrop-blur-sm dark:bg-purple-900">
                <code className="font-mono text-sm break-all text-purple-800 dark:text-purple-200">
                  {exampleCommand}
                </code>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
