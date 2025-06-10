import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/utils";
import { Database, HardDrive, Upload, Clock, type LucideIcon } from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  bgGradient: string;
}

interface UserStatsCardsProps {
  stats: any;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  const statCards: StatCard[] = [
    {
      title: "Total Files",
      value: stats.totalFiles.toLocaleString(),
      icon: Database,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient:
        "from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950",
    },
    {
      title: "Total Size",
      value: formatFileSize(stats.totalSize),
      icon: HardDrive,
      gradient: "from-purple-500 to-indigo-500",
      bgGradient:
        "from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950",
    },
    {
      title: "Recent Uploads",
      value: stats.recentUploads,
      subtitle: "Last 7 days",
      icon: Upload,
      gradient: "from-green-500 to-emerald-500",
      bgGradient:
        "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950",
    },
    {
      title: "Expiring Soon",
      value: stats.expiringSoon,
      subtitle: "Next 24 hours",
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
      bgGradient:
        "from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <Card
              className={`border-0 shadow-lg bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {stat.title}
                  </CardTitle>
                  <motion.div
                    className={`p-2 bg-gradient-to-br ${stat.gradient} rounded-lg shadow-md`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <IconComponent className="h-4 w-4 text-white" />
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <motion.div
                  className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2 + index * 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  {stat.value}
                </motion.div>
                {stat.subtitle && (
                  <motion.p
                    className="text-xs text-gray-600 dark:text-gray-400 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  >
                    {stat.subtitle}
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
