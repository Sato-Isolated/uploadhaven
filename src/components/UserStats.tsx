import connectDB from "@/lib/mongodb";
import { File } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/utils";

interface UserStatsProps {
  userId: string;
}

async function getUserStats(userId: string) {
  await connectDB();

  // Get basic file statistics
  const totalFiles = await File.countDocuments({ userId });

  const totalSizeResult = await File.aggregate([
    { $match: { userId } },
    { $group: { _id: null, totalSize: { $sum: "$size" } } },
  ]);

  const totalSize = totalSizeResult[0]?.totalSize || 0;
  // Visibility stats removed - all files use security by obscurity

  // Get recent uploads (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentUploads = await File.countDocuments({
    userId,
    uploadDate: { $gte: sevenDaysAgo },
  });

  // Get files expiring soon (next 24 hours)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiringSoon = await File.countDocuments({
    userId,
    expiresAt: { $lte: tomorrow, $gt: new Date() },
  });
  return {
    totalFiles,
    totalSize,
    recentUploads,
    expiringSoon,
    // Visibility stats removed - all files use security by obscurity
  };
}

export default async function UserStats({ userId }: UserStatsProps) {
  const stats = await getUserStats(userId);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFiles}</div>
          <p className="text-xs text-muted-foreground">
            {stats.recentUploads} uploaded this week
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="3" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatFileSize(stats.totalSize)}
          </div>
          <p className="text-xs text-muted-foreground">Across all files</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentUploads}</div>
          <p className="text-xs text-muted-foreground">
            Files uploaded this week
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.expiringSoon}</div>
          <p className="text-xs text-muted-foreground">
            Files expiring in 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
