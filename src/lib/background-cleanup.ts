import connectDB from "@/lib/mongodb";
import { File, saveSecurityEvent } from "@/lib/models";
import { unlink } from "fs/promises";
import path from "path";

interface CleanupStats {
  deletedCount: number;
  totalExpired: number;
  errors: string[];
}

class BackgroundCleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly intervalMs: number;
  private readonly uploadsDir: string;

  constructor(intervalMinutes = 5) {
    this.intervalMs = intervalMinutes * 60 * 1000; // Convert to milliseconds
    this.uploadsDir = path.join(process.cwd(), "public", "uploads");
  }

  /**
   * Start the background cleanup service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("Background cleanup service is already running");
      return;
    }

    console.log("Starting background cleanup service...");
    this.isRunning = true;

    // Run initial cleanup immediately
    await this.runCleanup();

    // Schedule regular cleanups
    this.intervalId = setInterval(async () => {
      await this.runCleanup();
    }, this.intervalMs);

    console.log(
      `Background cleanup service started (interval: ${
        this.intervalMs / 60000
      } minutes)`
    );
  }

  /**
   * Stop the background cleanup service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Background cleanup service stopped");
  }

  /**
   * Check if the service is currently running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Run a single cleanup operation
   */
  async runCleanup(): Promise<CleanupStats> {
    try {
      await connectDB();

      const now = new Date();

      // Find expired files that aren't already marked as deleted
      const expiredFiles = await File.find({
        expiresAt: { $lt: now },
        isDeleted: false,
      });

      const stats: CleanupStats = {
        deletedCount: 0,
        totalExpired: expiredFiles.length,
        errors: [],
      };

      if (expiredFiles.length === 0) {
        console.log("No expired files found during background cleanup");
        return stats;
      }

      console.log(
        `Background cleanup: Found ${expiredFiles.length} expired files`
      );

      // Process each expired file
      for (const file of expiredFiles) {
        try {
          // Mark as deleted in database
          await File.findByIdAndUpdate(file._id, { isDeleted: true });

          // Try to delete physical file
          try {
            const filePath = path.join(this.uploadsDir, file.filename);
            await unlink(filePath);
            console.log(`Background cleanup: Deleted ${file.filename}`);
          } catch (fsError) {
            // File might already be deleted from filesystem
            console.warn(
              `Background cleanup: Could not delete physical file ${file.filename}:`,
              (fsError as Error).message
            );
          }

          stats.deletedCount++;
        } catch (error) {
          const errorMsg = `Failed to process ${file.filename}: ${
            (error as Error).message
          }`;
          stats.errors.push(errorMsg);
          console.error(`Background cleanup error: ${errorMsg}`);
        }
      }

      // Log cleanup activity
      await saveSecurityEvent({
        type: "system_maintenance",
        ip: "127.0.0.1",
        details: `Background cleanup completed: ${stats.deletedCount} expired files removed`,
        severity: "low",
        userAgent: "Background Service",
        metadata: {
          deletedCount: stats.deletedCount,
          totalExpired: stats.totalExpired,
          errors: stats.errors.length,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(
        `Background cleanup completed: ${stats.deletedCount}/${stats.totalExpired} files processed`
      );

      return stats;
    } catch (error) {
      console.error("Background cleanup failed:", error);
      return {
        deletedCount: 0,
        totalExpired: 0,
        errors: [`Cleanup failed: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Immediately check for and delete a specific file if it's expired
   * This provides instant deletion capability
   */
  async checkAndDeleteFile(fileId: string): Promise<boolean> {
    try {
      await connectDB();

      const file = await File.findById(fileId);
      if (!file || file.isDeleted) {
        return false;
      }

      const now = new Date();
      if (file.expiresAt && file.expiresAt < now) {
        // File is expired, delete it immediately
        await File.findByIdAndUpdate(fileId, { isDeleted: true });

        try {
          const filePath = path.join(this.uploadsDir, file.filename);
          await unlink(filePath);
          console.log(
            `Instant deletion: Deleted expired file ${file.filename}`
          );
        } catch (fsError) {
          console.warn(
            `Instant deletion: Could not delete physical file ${file.filename}:`,
            (fsError as Error).message
          );
        }

        // Log instant deletion
        await saveSecurityEvent({
          type: "file_expired",
          ip: "127.0.0.1",
          details: `Instant deletion of expired file: ${file.filename}`,
          severity: "low",
          userAgent: "Background Service",
          metadata: {
            fileId: file._id.toString(),
            filename: file.filename,
            expiredAt: file.expiresAt?.toISOString(),
            deletedAt: new Date().toISOString(),
          },
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking/deleting file ${fileId}:`, error);
      return false;
    }
  }

  /**
   * Check for any files that should be expired and delete them immediately
   * This is useful for instant deletion when files reach their expiration time
   */
  async checkForInstantExpiration(): Promise<CleanupStats> {
    try {
      await connectDB();

      const now = new Date();

      // Find files that just expired (within the last minute)
      const justExpiredFiles = await File.find({
        expiresAt: {
          $gte: new Date(now.getTime() - 60000), // 1 minute ago
          $lt: now,
        },
        isDeleted: false,
      });

      const stats: CleanupStats = {
        deletedCount: 0,
        totalExpired: justExpiredFiles.length,
        errors: [],
      };

      for (const file of justExpiredFiles) {
        const deleted = await this.checkAndDeleteFile(file._id.toString());
        if (deleted) {
          stats.deletedCount++;
        }
      }

      return stats;
    } catch (error) {
      console.error("Error checking for instant expiration:", error);
      return {
        deletedCount: 0,
        totalExpired: 0,
        errors: [
          `Instant expiration check failed: ${(error as Error).message}`,
        ],
      };
    }
  }
}

// Export singleton instance
export const backgroundCleanupService = new BackgroundCleanupService();

// Export the class for potential custom instances
export { BackgroundCleanupService };
