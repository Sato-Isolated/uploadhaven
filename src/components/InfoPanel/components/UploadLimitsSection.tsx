"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HardDrive } from "lucide-react";
import {
  createSupportedFormats,
  createExpirationOptions,
  createSupportedTypes,
} from "../utils";
import { generateUuid } from "@/lib/utils";

export default function UploadLimitsSection() {
  const supportedFormats = createSupportedFormats();
  const expirationOptions = createExpirationOptions();
  const supportedTypes = createSupportedTypes();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 border-emerald-200 dark:border-emerald-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
              Upload Limits
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Maximum file size */}
            <motion.div
              className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Maximum file size
              </span>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
              >
                100 MB
              </Badge>
            </motion.div>

            {/* Supported formats */}
            <motion.div
              className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Supported formats
              </span>              <div className="flex gap-1">
                {supportedFormats.map((format) => (
                  <Badge key={generateUuid()} variant="outline" className={format.color}>
                    {format.name}
                  </Badge>
                ))}
              </div>
            </motion.div>

            {/* Expiration options */}
            <motion.div
              className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Expiration options
              </span>              <div className="flex gap-1">
                {expirationOptions.map((option) => (
                  <Badge key={generateUuid()} variant="outline" className={option.color}>
                    {option.label}
                  </Badge>
                ))}
              </div>
            </motion.div>

            <Separator className="bg-emerald-200 dark:bg-emerald-800" />

            {/* Supported file types details */}
            <motion.div
              className="text-sm text-emerald-700 dark:text-emerald-300 bg-white/40 dark:bg-gray-800/40 p-4 rounded-lg backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <p className="font-semibold">Supported file types:</p>              <ul className="mt-2 space-y-1 text-xs">
                {supportedTypes.map((type) => (
                  <li key={generateUuid()}>
                    • <strong>{type.name}:</strong> {type.extensions}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
