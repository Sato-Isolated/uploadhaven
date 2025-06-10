"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Trash2, RefreshCw } from "lucide-react";

interface SearchAndFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFiles: string[];
  onBulkDelete: () => void;
  isLoading: boolean;
}

export default function SearchAndFilters({
  searchQuery,
  setSearchQuery,
  selectedFiles,
  onBulkDelete,
  isLoading,
}: SearchAndFiltersProps) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search files by name, type, owner, or content..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          className="pl-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 focus:border-blue-500/60 transition-all duration-300"
        />
      </div>
      <div className="flex gap-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </motion.div>
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Selected ({selectedFiles.length})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
