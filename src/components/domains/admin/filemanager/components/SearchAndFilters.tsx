'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Trash2, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Search');

  return (
    <motion.div
      className="flex flex-col gap-4 sm:flex-row"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder={t('searchFilesByNameTypeOwnerContent')}
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          className="border border-gray-200/60 bg-white/50 pl-10 backdrop-blur-sm transition-all duration-300 focus:border-blue-500/60 dark:border-gray-700/60 dark:bg-gray-900/50"
        />
      </div>
      <div className="flex gap-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/50 backdrop-blur-sm dark:bg-gray-900/50"
          >
            <Filter className="mr-2 h-4 w-4" />
            {t('filter')}
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
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
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
