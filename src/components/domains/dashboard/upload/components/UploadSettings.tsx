'use client';

import { motion } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Shield } from 'lucide-react';
import { EXPIRATION_OPTIONS } from '@/components/domains/upload/fileuploader/types';

interface UploadSettingsProps {
  showSettings: boolean;
  expiration: string;
  isPasswordProtected: boolean;
  onExpirationChange: (value: string) => void;
  onPasswordProtectedChange: (value: boolean) => void;
}

export function UploadSettings({
  showSettings,
  expiration,
  isPasswordProtected,
  onExpirationChange,
  onPasswordProtectedChange,
}: UploadSettingsProps) {
  if (!showSettings) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6 rounded-lg border bg-gray-50 p-4 dark:bg-gray-800/50"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Expires in:</span>
          <Select value={expiration} onValueChange={onExpirationChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Password protect:</span>
          <input
            type="checkbox"
            id="password-protection"
            checked={isPasswordProtected}
            onChange={(e) => onPasswordProtectedChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
    </motion.div>
  );
}
