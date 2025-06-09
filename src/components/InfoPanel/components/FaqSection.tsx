"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";
import { FaqProps } from "../types";

export default function FaqSection({ faqs }: FaqProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-900 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <span className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={`faq-${index}-${faq.question.slice(0, 20)}`}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: faq.delay }}
                  className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm"
                >
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                    {faq.question}
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                    {faq.answer}
                  </p>
                </motion.div>
                {index < faqs.length - 1 && (
                  <Separator className="bg-orange-200 dark:bg-orange-800 mt-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
