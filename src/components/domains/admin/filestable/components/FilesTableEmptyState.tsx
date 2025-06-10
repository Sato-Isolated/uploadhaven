import { motion } from "motion/react";
import { FileText } from "lucide-react";

export function FilesTableEmptyState() {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <motion.div
        className="relative mx-auto w-20 h-20 mb-6"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-lg">
          <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        No files found
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        No files match your search criteria.
      </p>
    </motion.div>
  );
}
