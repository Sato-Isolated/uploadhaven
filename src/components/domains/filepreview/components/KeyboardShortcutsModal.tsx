'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Keyboard, X } from 'lucide-react';
import { useKeyboardLayoutDetection } from '@/lib/ui/keyboard';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const t = useTranslations('FilePreview');
  const keyboardLayout = useKeyboardLayoutDetection();

  const shortcuts = keyboardLayout.shortcuts;
  const formatKeys = (keys: string): string => {
    return keys
      .split(' / ')
      .map((key) => {
        // Format special keys for display
        switch (key.trim()) {
          case ' ':
          case 'Space':
          case 'Espace':
          case 'Leertaste':
            return 'Space';
          case '↑':
            return '↑';
          case '↓':
            return '↓';
          case '←':
            return '←';
          case '→':
            return '→';
          default:
            return key.toUpperCase();
        }
      })
      .join(' / ');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('keyboardShortcuts')}
                </h2>{' '}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {keyboardLayout.detectionMethod === 'language-fallback' &&
                  keyboardLayout.confidence < 0.5 ? (
                    'Detecting layout...'
                  ) : (
                    <>
                      {t('layoutDetected', {
                        layout: keyboardLayout.layout.toUpperCase(),
                      })}
                      <span className="ml-2 text-xs">
                        ({Math.round(keyboardLayout.confidence * 100)}%
                        confidence)
                      </span>
                    </>
                  )}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      keyboardLayout.confidence > 0.8
                        ? 'bg-green-500'
                        : keyboardLayout.confidence > 0.5
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs text-gray-400">
                    {keyboardLayout.detectionMethod === 'keyboard-api'
                      ? 'Hardware API'
                      : keyboardLayout.detectionMethod === 'key-testing'
                        ? 'Real-time testing'
                        : 'Language fallback'}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>{' '}
          <div className="space-y-3">
            {Object.entries(shortcuts).map(([action, keys]) => (
              <motion.div
                key={action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t(`shortcuts.${action}`, {
                    defaultValue: action,
                  })}
                </span>
                <div className="flex items-center gap-1">
                  {formatKeys(keys)
                    .split(' / ')
                    .map((key, index, array) => (
                      <div key={index} className="flex items-center">
                        <kbd className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {key}
                        </kbd>
                        {index < array.length - 1 && (
                          <span className="mx-1 text-xs text-gray-400">/</span>
                        )}
                      </div>
                    ))}
                </div>
              </motion.div>
            ))}

            {/* Additional shortcuts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('shortcuts.reset')}
              </span>
              <kbd className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                R
              </kbd>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('shortcuts.seek', { percentage: '10-90' })}
              </span>
              <div className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  1-9
                </kbd>
              </div>
            </motion.div>
          </div>{' '}
          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              {keyboardLayout.layout.toUpperCase()} keyboard layout detected
              <span className="ml-2">
                ({Math.round(keyboardLayout.confidence * 100)}% confidence,{' '}
                {keyboardLayout.detectionMethod})
              </span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function KeyboardShortcutsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-white/80 hover:bg-white/20 hover:text-white"
        title="Keyboard Shortcuts"
      >
        <Keyboard className="h-4 w-4" />
      </Button>
      <KeyboardShortcutsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
