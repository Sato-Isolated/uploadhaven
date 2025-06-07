import mongoose from 'mongoose'

// TypeScript interfaces for the schemas
export interface IUser {
  _id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  role: 'user' | 'admin'
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}

export interface IFile {
  _id: string
  filename: string
  shortUrl: string
  originalName: string
  mimeType: string
  size: number
  uploadDate: Date 
  expiresAt: Date
  downloadCount: number
  ipAddress: string
  userAgent?: string
  scanResult: {
    safe: boolean
    threat?: string
    scanDate?: Date
  }
  isDeleted: boolean
  userId?: string
  isAnonymous: boolean
  // Visibility removed - all files use security by obscurity
  password?: string // hashed password for protected files
  isPasswordProtected: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ISecurityEvent {
  _id: string
  type: string
  timestamp: Date
  ip: string
  details: string
  severity: 'low' | 'medium' | 'high'
  userAgent?: string
  filename?: string
  fileSize?: number
  fileType?: string
  metadata: Record<string, unknown>
  userId?: string
  createdAt: Date
  updatedAt: Date
}

// User model schema (matches better-auth user schema)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    required: false
  },
  // Additional field for role (defined in auth.ts)
  role: {
    type: String,
    default: "user",
    enum: ['user', 'admin']
  },  // Track when user was last active (login, upload, etc.)
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
})

// File model schema
const fileSchema = new mongoose.Schema({  filename: {
    type: String,
    required: true,
    unique: true
  },  shortUrl: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  scanResult: {
    safe: {
      type: Boolean,
      default: true
    },
    threat: String,
    scanDate: Date
  },  isDeleted: {
    type: Boolean,
    default: false
  },  // User fields for authenticated uploads
  userId: {
    type: String,
    required: false // Optional for anonymous uploads
  },  isAnonymous: {
    type: Boolean,
    default: true
  },
  // Visibility removed - all files use security by obscurity
  // Password protection fields
  password: {
    type: String,
    required: false // Only set if file is password protected
  },
  isPasswordProtected: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Security event model schema
const securityEventSchema = new mongoose.Schema({  type: {
    type: String,
    enum: ['rate_limit', 'invalid_file', 'large_file', 'blocked_ip', 'suspicious_activity', 'file_scan', 'malware_detected', 'file_deletion', 'bulk_delete', 'file_upload', 'user_registration', 'file_download', 'user_login', 'user_logout', 'user_role_changed'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  userAgent: String,
  filename: String,
  fileSize: Number,
  fileType: String,  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: String,
    required: false // Optional for anonymous activities
  }
}, {
  timestamps: true
})

// Add indexes for better performance
userSchema.index({ role: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ lastActivity: -1 }) // Index for activity queries

fileSchema.index({ expiresAt: 1 })
fileSchema.index({ uploadDate: -1 })
fileSchema.index({ isDeleted: 1 })

securityEventSchema.index({ timestamp: -1 })
securityEventSchema.index({ type: 1 })
securityEventSchema.index({ ip: 1 })
securityEventSchema.index({ severity: 1 })

// Export models with better NextJS compatibility and proper typing
function getOrCreateModel<T>(name: string, schema: mongoose.Schema, collection?: string): mongoose.Model<T> {
  // Check if model already exists
  if (mongoose.models[name]) {
    return mongoose.models[name] as mongoose.Model<T>
  }
  // Create new model if it doesn't exist
  return mongoose.model<T>(name, schema, collection)
}

export const User = getOrCreateModel<IUser>('User', userSchema, 'user')
export const File = getOrCreateModel<IFile>('File', fileSchema)
export const SecurityEvent = getOrCreateModel<ISecurityEvent>('SecurityEvent', securityEventSchema)

// Helper functions
export const saveFileMetadata = async (fileData: {
  filename: string
  shortUrl: string
  originalName: string
  mimeType: string
  size: number
  expiresAt: Date
  ipAddress: string
  userAgent?: string
  scanResult?: {
    safe: boolean
    threat?: string
    scanDate: Date
  }
  userId?: string
  isAnonymous?: boolean
  // Visibility removed - all files use security by obscurity
  password?: string // hashed password
  isPasswordProtected?: boolean
}) => {
  try {
    const file = new File(fileData)
    await file.save()
    return file
  } catch (error) {
    console.error('Error saving file metadata:', error)
    throw error
  }
}

export const saveSecurityEvent = async (eventData: {  type: string
  ip: string
  details: string
  severity: string
  userAgent?: string
  filename?: string
  fileSize?: number
  fileType?: string
  metadata?: Record<string, unknown>
  userId?: string
}) => {
  try {
    const event = new SecurityEvent(eventData)
    await event.save()
    return event
  } catch (error) {
    console.error('Error saving security event:', error)
    throw error
  }
}

export const getFileMetadata = async (filename: string) => {
  try {
    return await File.findOne({ filename, isDeleted: false })
  } catch (error) {
    console.error('Error getting file metadata:', error)
    throw error
  }
}

export const incrementDownloadCount = async (filename: string) => {
  try {
    return await File.findOneAndUpdate(
      { filename, isDeleted: false },
      { $inc: { downloadCount: 1 } },
      { new: true }
    )
  } catch (error) {
    console.error('Error incrementing download count:', error)
    throw error
  }
}

export const getSecurityStats = async () => {
  try {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      totalEvents,
      rateLimitHits,
      invalidFiles,
      malwareDetected,
      largeSizeBlocked,
      last24hEvents,
      blockedIPs
    ] = await Promise.all([
      SecurityEvent.countDocuments({}),
      SecurityEvent.countDocuments({ type: 'rate_limit' }),
      SecurityEvent.countDocuments({ type: 'invalid_file' }),
      SecurityEvent.countDocuments({ type: 'malware_detected' }),
      SecurityEvent.countDocuments({ type: 'large_file' }),
      SecurityEvent.countDocuments({ timestamp: { $gte: last24h } }),
      SecurityEvent.distinct('ip', { type: 'blocked_ip' }).then(ips => ips.length)
    ])

    return {
      totalEvents,
      rateLimitHits,
      invalidFiles,
      blockedIPs,
      last24h: last24hEvents,
      malwareDetected,
      largeSizeBlocked
    }
  } catch (error) {
    console.error('Error getting security stats:', error)
    throw error
  }
}

export const getRecentSecurityEvents = async (limit = 50) => {
  try {
    return await SecurityEvent.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
  } catch (error) {
    console.error('Error getting recent security events:', error)
    throw error
  }
}

export const cleanupExpiredFiles = async () => {
  try {
    const now = new Date()
    const expiredFiles = await File.find({
      expiresAt: { $lt: now },
      isDeleted: false
    })

    const result = await File.updateMany(
      { expiresAt: { $lt: now }, isDeleted: false },
      { isDeleted: true }
    )

    return {
      deletedCount: result.modifiedCount,
      expiredFiles: expiredFiles.map(f => f.filename)
    }
  } catch (error) {
    console.error('Error cleaning up expired files:', error)
    throw error
  }
}
