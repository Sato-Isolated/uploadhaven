'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Files, 
  Activity, 
  Settings,
  Shield
} from 'lucide-react';
import { useTranslations } from 'next-intl';

// Import des sous-composants
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
import RecentActivity from './components/RecentActivity';
import UsersTable from './components/UsersTable';
import FilesTable from './components/FilesTable';
import SystemHealth from './components/SystemHealth';
import SecurityHealth from './components/SecurityHealth';

// Import du hook de données
import { useAdminData } from './hooks/useAdminData';

interface AdminBoardProps {
  className?: string;
}

export default function AdminBoard({ className = '' }: AdminBoardProps) {
  const t = useTranslations('Admin');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Hook centralisé pour toutes les données admin
  const {
    stats,
    users,
    files,
    activities,
    systemHealth,
    isLoading,
    error,
    refreshData
  } = useAdminData();
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent>
            <Shield className="mx-auto mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
            <h2 className="mb-2 text-xl font-semibold text-red-700 dark:text-red-400">
              {t('errorLoadingAdmin')}
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={refreshData} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-all duration-300 ${className}`}>
      {/* Header - Enhanced for dark mode */}
      <div className="border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 backdrop-blur-md dark:bg-slate-900/80 shadow-sm dark:shadow-gray-900/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                {t('adminDashboard')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {t('manageYourPlatform')}
              </p>
            </div>
              {/* Quick Actions - Zero Knowledge Compliant */}
            <div className="flex items-center gap-3">
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2 border-gray-300/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/60 transition-all duration-200"
              >
                <Activity className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-gray-300/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/60 transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                {t('settings')}
              </Button>
            </div>
          </div>
        </div>
      </div>      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">          {/* Navigation - Simplified Zero Knowledge Tabs */}
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex bg-white/80 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 shadow-lg dark:shadow-gray-900/50 rounded-xl p-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 dark:data-[state=active]:from-blue-500 dark:data-[state=active]:to-blue-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 cursor-pointer transition-all duration-300 rounded-lg font-medium"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('overview')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 dark:data-[state=active]:from-blue-500 dark:data-[state=active]:to-blue-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 cursor-pointer transition-all duration-300 rounded-lg font-medium"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t('users')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="files"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 dark:data-[state=active]:from-blue-500 dark:data-[state=active]:to-blue-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 cursor-pointer transition-all duration-300 rounded-lg font-medium"
            >
              <Files className="h-4 w-4" />
              <span className="hidden sm:inline">{t('files')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="system"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 dark:data-[state=active]:from-blue-500 dark:data-[state=active]:to-blue-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 cursor-pointer transition-all duration-300 rounded-lg font-medium"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('security')}</span>
            </TabsTrigger>
          </TabsList>          {/* Overview Tab - Complete dashboard */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <StatsCards stats={stats} isLoading={isLoading} />
                {/* Grid Layout for Activities and System Health */}
              <div className="grid gap-6 lg:grid-cols-2">
                <RecentActivity activities={activities} isLoading={isLoading} />
                <SystemHealth health={systemHealth} isLoading={isLoading} />
              </div>
              
              {/* Zero Knowledge Compliant Quick Actions */}
              <QuickActions />
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <UsersTable users={users} isLoading={isLoading} onRefresh={refreshData} />
            </motion.div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FilesTable files={files} isLoading={isLoading} onRefresh={refreshData} />
            </motion.div>
          </TabsContent>          {/* Security & System Tab - Zero Knowledge Compliant */}
          <TabsContent value="system" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Security Health - Comprehensive View */}
              <SecurityHealth detailed />
              
              {/* System Health - Detailed View */}
              <SystemHealth health={systemHealth} isLoading={isLoading} detailed />
              
              {/* Security Settings - Zero Knowledge Compliant */}
              <Card className="bg-white/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 shadow-sm dark:shadow-gray-900/30 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {t('securitySettings')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">
                            {t('zeroKnowledgeCompliance')}
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {t('zeroKnowledgeComplianceDesc')}
                          </p>
                          <div className="grid gap-2 mt-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-blue-700 dark:text-blue-300">{t('encryptionActive')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-blue-700 dark:text-blue-300">{t('noPlaintextStorage')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-blue-700 dark:text-blue-300">{t('autoDeleteActive')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
