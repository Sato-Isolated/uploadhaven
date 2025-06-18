import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import AdminDashboard from '@/components/domains/admin/dashboard';
import AdminFileManager from '@/components/domains/admin/filemanager';
import AdminUserListWrapper from '@/components/domains/admin/users/AdminUserListWrapper';
import AdminAnalytics from '@/components/domains/admin/analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper function to fetch data with error handling
async function fetchData(endpoint: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Get the current headers to forward cookies/session data
    const headersList = await headers();
    const cookie = headersList.get('cookie');
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      cache: 'no-store', // Always get fresh data for admin panel
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { Cookie: cookie }), // Forward cookies for authentication
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const t = await getTranslations('Admin');
  const tNav = await getTranslations('Navigation');

  if (!session) {
    redirect('/auth/signin');
  }

  // Check if user is admin (for now, we'll just check if they're authenticated)
  // Later we'll add proper role checking
  if (
    session.user.role !== 'admin' &&
    session.user.email !== 'admin@uploadhaven.com'
  ) {
    redirect('/dashboard');
  } // Fetch data for admin components
  const [statsData, filesData, usersData] = await Promise.all([
    fetchData('/api/stats?includeEvents=true'),
    fetchData('/api/files'),
    fetchData('/api/admin/users'),
  ]); // Map stats data to match AdminDashboard component expectations
  const dashboardStats = statsData
    ? {
        totalFiles: statsData.stats?.totalFiles || 0,
        totalUsers: statsData.users?.totalUsers || 0,
        totalStorage: statsData.stats?.totalSize || '0 Bytes',
        todayUploads: statsData.stats?.last24hUploads || 0,
        activeUsers: statsData.users?.activeUsersLast7d || 0, // Users active in last 7 days
        securityEvents: statsData.security?.totalEvents || 0,
      }
    : {
        totalFiles: 0,
        totalUsers: 0,
        totalStorage: '0 Bytes',
        todayUploads: 0,
        activeUsers: 0,
        securityEvents: 0,
      }; // Map files data to match AdminFileManager component expectations
  const adminFiles =
    filesData?.files?.map(
      (file: {
        id: string;
        name: string;
        originalName: string;
        size: number;
        mimeType: string;
        uploadDate: string;
        downloadCount: number;
        userId?: string;
        userName?: string;
      }) => ({
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        uploadDate: file.uploadDate,
        downloadCount: file.downloadCount,
        userId: file.userId || undefined,
        userName: file.userName || undefined,
        isAnonymous: !file.userId,
      })
    ) || [];
  // Ensure users data is valid and filter out any invalid entries
  const validUsersData = Array.isArray(usersData?.users)
    ? usersData.users.filter(
        (user: { id?: string; email?: string; name?: string }) =>
          user && user.id && user.email && user.name
      )
    : [];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Background Elements */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-300 opacity-20 mix-blend-multiply blur-xl filter"></div>
          <div className="animate-blob animation-delay-2000 absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-yellow-300 opacity-20 mix-blend-multiply blur-xl filter"></div>
          <div className="animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-pink-300 opacity-20 mix-blend-multiply blur-xl filter"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 mb-8 flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:via-blue-200 dark:to-indigo-200">
              {t('panel')}
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              {t('manageDescription')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-gray-200 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white dark:border-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800"
              >
                {tNav('dashboard')}
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="border-gray-200 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white dark:border-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800"
              >
                {tNav('home')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 border border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                {t('overview')}
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                {t('files')}
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                {t('users')}
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                {t('analytics')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-6">
              <AdminDashboard stats={dashboardStats} />
            </TabsContent>
            <TabsContent value="files" className="space-y-6">
              <AdminFileManager files={adminFiles} />
            </TabsContent>
            <TabsContent value="users" className="space-y-6">
              <AdminUserListWrapper users={validUsersData} />
            </TabsContent>
            <TabsContent value="analytics" className="space-y-6">
              <AdminAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
