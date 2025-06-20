import mongoose from 'mongoose';
import type {
  IUser as BaseIUser,
  IFile as BaseIFile,
} from '@/types';
import type { INotification as BaseINotification } from '@/types/database';

// Re-export centralized interfaces
export type IUser = BaseIUser;
export type IFile = BaseIFile;
export type INotification = BaseINotification;

// User model schema (matches better-auth user schema)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      required: false,
    },
    // Additional field for role (defined in auth.ts)
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
    },    // Track when user was last active (login, upload, etc.)
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Admin can suspend users (independent of lastActivity)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

// File model schema
const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    shortUrl: {
      type: String,
      required: true,
      unique: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },// User fields for authenticated uploads
    userId: {
      type: String,
      required: false, // Optional for anonymous uploads
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    // Visibility removed - all files use security by obscurity    // Password protection fields
    password: {
      type: String,
      required: false, // Only set if file is password protected
    },
    isPasswordProtected: {
      type: Boolean,
      default: false,
    },    // Zero-Knowledge encryption fields (client-side encryption)
    isZeroKnowledge: {
      type: Boolean,
      default: false,
    },    // Security fields
    ipHash: {
      type: String,
      required: false,
    },
    downloadLimit: {
      type: Number,
      required: false,
    },zkMetadata: {
      algorithm: String, // e.g., 'AES-GCM'
      iv: String, // base64 encoded IV (stored for client decryption)
      salt: String, // base64 encoded salt (for password-derived keys)
      iterations: Number, // PBKDF2 iterations
      encryptedSize: Number, // size of encrypted blob
      uploadTimestamp: Number, // when encrypted blob was uploaded
      keyHint: {
        type: String,
        enum: ['password', 'embedded'],
        required: false,
      }, // hint for UI about key type
      contentCategory: {
        type: String,
        enum: ['media', 'document', 'archive', 'text', 'other'],
        required: false,
      }, // General content type for preview      // Original file metadata for ZK files
      originalType: String, // Original MIME type before encryption
      originalName: String, // Original filename before encryption
      originalSize: String, // Original file size before encryption
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActivity: -1 }); // Index for activity queries

fileSchema.index({ expiresAt: 1 });
fileSchema.index({ uploadDate: -1 });
fileSchema.index({ isDeleted: 1 });

// Notification model schema
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true, // Target user for the notification
    },    type: {
      type: String,
      enum: [
        'file_downloaded',
        'file_expired_soon',
        'file_shared',
        'security_alert',
        'system_announcement',
        'file_upload_complete',
        'bulk_action_complete',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },    relatedFileId: {
      type: String,
      required: false, // Optional reference to a file
    },
    actionUrl: {
      type: String,
      required: false, // Optional URL for action button
    },
    actionLabel: {
      type: String,
      required: false, // Optional label for action button
    },
    expiresAt: {
      type: Date,
      required: false, // Optional expiration for notifications
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for notifications
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 });

// Export models with better NextJS compatibility and proper typing
function getOrCreateModel<T>(
  name: string,
  schema: mongoose.Schema,
  collection?: string
): mongoose.Model<T> {
  // Check if model already exists
  if (mongoose.models[name]) {
    return mongoose.models[name] as mongoose.Model<T>;
  }
  // Create new model if it doesn't exist
  return mongoose.model<T>(name, schema, collection);
}

export const User = getOrCreateModel<IUser>('User', userSchema, 'user');
export const File = getOrCreateModel<IFile>('File', fileSchema);
export const Notification = getOrCreateModel<INotification>(
  'Notification',
  notificationSchema
);

// Helper functions
export const saveFileMetadata = async (fileData: {
  filename: string;
  shortUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  expiresAt: Date;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  isAnonymous?: boolean;// Visibility removed - all files use security by obscurity
  password?: string; // hashed password
  isPasswordProtected?: boolean;
  // Zero-Knowledge encryption fields (client-side encryption)
  isZeroKnowledge?: boolean;
  zkMetadata?: {
    algorithm: string; // e.g., 'AES-GCM'
    iv: string; // base64 encoded IV (stored for client decryption)
    salt: string; // base64 encoded salt (for password-derived keys)
    iterations: number; // PBKDF2 iterations
    encryptedSize: number; // size of encrypted blob
    uploadTimestamp: number; // when encrypted blob was uploaded
    keyHint?: 'password' | 'embedded'; // hint for UI about key type
    contentCategory?: 'media' | 'document' | 'archive' | 'text' | 'other'; // General content type for preview
    // Original file metadata for ZK files
    originalType?: string; // Original MIME type before encryption
    originalName?: string; // Original filename before encryption
    originalSize?: string; // Original file size before encryption
  };
}) => {
  try {
    const file = new File(fileData);
    await file.save();
    return file;
  } catch (error) {
    // Error saving file metadata
    throw error;
  }
};

export const getFileMetadata = async (filename: string) => {
  try {
    return await File.findOne({ filename, isDeleted: false });
  } catch (error) {
    // Error getting file metadata
    throw error;
  }
};

export const incrementDownloadCount = async (filename: string) => {
  try {
    return await File.findOneAndUpdate(
      { filename, isDeleted: false },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
  } catch (error) {
    // Error incrementing download count
    throw error;
  }
};

// Notification helper functions
export const saveNotification = async (notificationData: {
  userId: string;
  type: string;
  title: string;
  message: string;  priority?: string;
  relatedFileId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    // Error saving notification
    throw error;
  }
};

export const getNotificationsForUser = async (
  userId: string,
  options: {
    limit?: number;
    includeRead?: boolean;
    type?: string;
  } = {}
) => {
  try {
    const { limit = 50, includeRead = true, type } = options;

    const filter: Record<string, unknown> = { userId };

    if (!includeRead) {
      filter.isRead = false;
    }

    if (type) {
      filter.type = type;
    }

    // Only include non-expired notifications
    filter.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ];

    return await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    // Error getting notifications
    throw error;
  }
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  try {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  } catch (error) {
    // Error marking notification as read
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  } catch (error) {
    // Error marking all notifications as read
    throw error;
  }
};

export const deleteNotification = async (
  notificationId: string,
  userId: string
) => {
  try {
    return await Notification.findOneAndDelete({ _id: notificationId, userId });
  } catch (error) {
    // Error deleting notification
    throw error;
  }
};

export const getNotificationStats = async (userId: string) => {
  try {
    const now = new Date();

    const [total, unread, byPriority, byType] = await Promise.all([
      // Total notifications (non-expired)
      Notification.countDocuments({
        userId,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
      }),

      // Unread notifications
      Notification.countDocuments({
        userId,
        isRead: false,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
      }),

      // By priority
      Notification.aggregate([
        {
          $match: {
            userId,
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: { $gt: now } },
            ],
          },
        },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),

      // By type
      Notification.aggregate([
        {
          $match: {
            userId,
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: { $gt: now } },
            ],
          },
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Process aggregation results
    const priorityStats = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    };
    byPriority.forEach((item: { _id: string; count: number }) => {
      if (item._id && priorityStats.hasOwnProperty(item._id)) {
        priorityStats[item._id as keyof typeof priorityStats] = item.count;
      }
    });
    const typeStats: Record<string, number> = {};
    byType.forEach((item: { _id: string; count: number }) => {
      if (item._id) {
        typeStats[item._id] = item.count;
      }
    });

    return {
      total,
      unread,
      byPriority: priorityStats,
      byType: typeStats,
    };
  } catch (error) {
    // Error getting notification stats
    throw error;
  }
};


