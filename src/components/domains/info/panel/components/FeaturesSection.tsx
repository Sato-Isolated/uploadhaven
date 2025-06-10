"use client";

import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ZapIcon } from "lucide-react";
import { FeaturesProps } from "../types";

export default function FeaturesSection({ features }: FeaturesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ZapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Features
            </span>
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            What makes UploadHaven special
          </CardDescription>
        </CardHeader>        <CardContent>          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={`${feature.title}-${index}`}
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: feature.delay }}
              >
                <div className={`p-2 ${feature.iconBgColor} rounded-lg`}>
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
