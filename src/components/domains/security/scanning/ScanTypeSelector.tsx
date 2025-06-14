'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Search, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ScanType } from '@/types/security';
import { BaseComponentProps } from '@/types';

interface ScanTypeOption {
  id: ScanType;
  name: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  color: string;
}

interface ScanTypeSelectorProps extends BaseComponentProps {
  selectedScanType: ScanType;
  onScanTypeChange: (type: ScanType) => void;
  disabled?: boolean;
}

const scanTypeOptions: ScanTypeOption[] = [
  {
    id: 'quick',
    name: 'Quick Scan',
    description: 'Basic security checks and threat detection',
    duration: '~30 seconds',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-blue-500',
  },
  {
    id: 'full',
    name: 'Full System Scan',
    description: 'Comprehensive scan of all files and system integrity',
    duration: '~2-5 minutes',
    icon: <Search className="h-5 w-5" />,
    color: 'bg-orange-500',
  },
  {
    id: 'custom',
    name: 'Custom Scan',
    description: 'Advanced scanning with custom security checks',
    duration: '~1-3 minutes',
    icon: <Shield className="h-5 w-5" />,
    color: 'bg-purple-500',
  },
];

/**
 * ScanTypeSelector Component
 *
 * Extracted from SecurityScanModal to handle scan type selection.
 * Provides a clean, reusable interface for choosing security scan types.
 *
 * Features:
 * - Visual scan type cards with descriptions
 * - Animation and hover effects
 * - Disabled state support
 * - Accessible button controls
 */
export default function ScanTypeSelector({
  selectedScanType,
  onScanTypeChange,
  disabled = false,
  className = '',
}: ScanTypeSelectorProps) {
  const t = useTranslations('Security');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{t('selectScanType')}</CardTitle>
        <CardDescription>{t('chooseScanTypeDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {scanTypeOptions.map((type) => (
            <motion.div
              key={type.id}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
            >
              <Button
                variant={selectedScanType === type.id ? 'default' : 'outline'}
                onClick={() => !disabled && onScanTypeChange(type.id)}
                disabled={disabled}
                className={`flex h-auto w-full flex-col items-start gap-2 p-4 ${
                  selectedScanType === type.id ? type.color : ''
                }`}
              >
                <div className="flex w-full items-center gap-2">
                  {type.icon}
                  <span className="font-medium">{type.name}</span>
                </div>
                <p className="text-left text-xs opacity-80">
                  {type.description}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {type.duration}
                </Badge>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { ScanTypeSelector };
