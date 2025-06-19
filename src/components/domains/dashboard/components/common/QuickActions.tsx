// QuickActions component following SRP principles
// Responsibility: Display quick action buttons and shortcuts

'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Settings, 
  Download, 
  Upload,
  FileText,
  Shield,
  Users,
  Zap
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className = '' }: QuickActionsProps) {
  const tDashboard = useTranslations('Dashboard');
  const tNavigation = useTranslations('Navigation');

  const quickActions = [
    {
      icon: BarChart3,
      label: 'Analytics',
      href: '/dashboard/analytics',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
    },
    {
      icon: FileText,
      label: 'All Files',
      href: '/dashboard/files',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20'
    },
    {
      icon: Upload,
      label: 'Upload',
      href: '#upload',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/dashboard/settings',
      color: 'from-gray-500 to-slate-500',
      bgColor: 'from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20'
    }
  ];

  return (
    <Card className={`bg-gradient-to-br from-white/60 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-900/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={action.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-auto p-3 rounded-lg bg-gradient-to-r ${action.bgColor} hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50`}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} shadow-sm mr-3`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActions;
