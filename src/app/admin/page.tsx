import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AdminDashboard from "@/components/AdminDashboard";
import AdminFileManager from "@/components/AdminFileManager";
import AdminUserListWrapper from "@/components/AdminUserList/AdminUserListWrapper";
import DownloadAnalytics from "@/components/DownloadAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to fetch data with error handling
async function fetchData(endpoint: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}${endpoint}`, {
      cache: "no-store", // Always get fresh data for admin panel
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

  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user is admin (for now, we'll just check if they're authenticated)
  // Later we'll add proper role checking
  if (
    session.user.role !== "admin" &&
    session.user.email !== "admin@uploadhaven.com"
  ) {
    redirect("/dashboard");
  } // Fetch data for admin components
  const [statsData, filesData, usersData] = await Promise.all([
    fetchData("/api/stats?includeEvents=true"),
    fetchData("/api/files"),
    fetchData("/api/admin/users"),
  ]); // Map stats data to match AdminDashboard component expectations
  const dashboardStats = statsData
    ? {
        totalFiles: statsData.stats?.totalFiles || 0,
        totalUsers: statsData.users?.totalUsers || 0,
        totalStorage: statsData.stats?.totalSize || "0 Bytes",
        todayUploads: statsData.stats?.last24hUploads || 0,
        activeUsers: statsData.users?.activeUsersLast7d || 0, // Users active in last 7 days
        securityEvents: statsData.security?.totalEvents || 0,
      }
    : {
        totalFiles: 0,
        totalUsers: 0,
        totalStorage: "0 Bytes",
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Manage users, files, and system settings
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
              >
                Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                Files
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                Users
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-6">
              <AdminDashboard stats={dashboardStats} />
            </TabsContent>
            <TabsContent value="files" className="space-y-6">
              <AdminFileManager files={adminFiles} />
            </TabsContent>
            <TabsContent value="users" className="space-y-6">
              <AdminUserListWrapper users={usersData?.users || []} />
            </TabsContent>
            <TabsContent value="analytics" className="space-y-6">
              <DownloadAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
