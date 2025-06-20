/**
 * MongoDB Models for Audit and Logging System
 * Security-first, GDPR-compliant audit database models
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { 
  AuditLog as IAuditLog, 
  AuditCategory, 
  AuditSeverity, 
  AuditStatus,
  AuditAlert as IAuditAlert,
  AuditRetentionPolicy as IAuditRetentionPolicy
} from '@/types/audit';
import type { EncryptedData } from '@/lib/encryption/aes-gcm';

// =============================================================================
// Interface Extensions for MongoDB Documents
// =============================================================================

export interface IAuditLogDocument extends Document {
  id: string;
  category: AuditCategory;
  action: string;
  description: string;
  severity: AuditSeverity;
  status: AuditStatus;
  timestamp: Date;
  ipHash: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
  adminId?: string;
  metadata: Record<string, unknown>;
  encryptedFields?: Record<string, string>; // Encrypted field storage
  createdAt: Date;
  expiresAt: Date;
}

export interface IAuditLogModel extends Model<IAuditLogDocument> {
  findWithFilters(filters: any, options?: any): any;
  getStats(timeRange?: string): Promise<any>;
}

export interface IAuditAlertDocument extends Omit<IAuditAlert, 'id'>, Document {}
export interface IAuditRetentionPolicyDocument extends Omit<IAuditRetentionPolicy, 'id'>, Document {}

// =============================================================================
// Base Audit Log Schema
// =============================================================================

const auditLogSchema = new Schema<IAuditLogDocument>({
  category: {
    type: String,
    required: true,
    enum: [
      'user_action',
      'admin_action', 
      'security_event',
      'system_event',
      'data_access',
      'file_operation',
      'auth_event',
      'compliance'
    ],
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  severity: {
    type: String,
    required: true,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure', 'pending', 'cancelled'],
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  ipHash: {
    type: String,
    required: true,
    index: true,
    maxlength: 64 // SHA-256 hash length
  },
  userAgent: {
    type: String,
    maxlength: 500
  },
  sessionId: {
    type: String,
    index: true,
    maxlength: 100
  },
  userId: {
    type: String,
    index: true,
    maxlength: 50
  },
  adminId: {
    type: String,
    index: true,
    maxlength: 50
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  encryptedFields: {
    type: Schema.Types.Mixed,
    default: {},
    select: false // Don't include by default for security
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// =============================================================================
// Indexes for Performance
// =============================================================================

// Compound indexes for common queries
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ ipHash: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, category: 1 });

// Text index for full-text search
auditLogSchema.index({ 
  action: 'text', 
  description: 'text' 
});

// TTL index for automatic cleanup
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Geospatial index for IP location data (if needed)
auditLogSchema.index({ 'metadata.location': '2dsphere' });

// =============================================================================
// Pre-save Middleware for Auto-fields
// =============================================================================

auditLogSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set expiration based on category (GDPR compliance)
    if (!this.expiresAt) {
      const retentionDays = getRetentionDaysForCategory(this.category);
      this.expiresAt = new Date(Date.now() + (retentionDays * 24 * 60 * 60 * 1000));
    }
    
    // Generate ID if not provided
    if (!this.id) {
      this.id = new mongoose.Types.ObjectId().toString();
    }
  }
  next();
});

// =============================================================================
// Instance Methods
// =============================================================================

auditLogSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.encryptedFields;
  delete obj.__v;
  return obj;
};

auditLogSchema.methods.decrypt = async function(encryptionKey: string) {  // Decrypt sensitive fields if admin access
  if (this.encryptedFields && encryptionKey) {
    const { decryptData } = await import('@/lib/encryption/aes-gcm');
    
    for (const [field, encryptedValue] of Object.entries(this.encryptedFields)) {
      try {
        // The encrypted value is stored as a JSON string, so we need to parse it first.
        const encryptedDataObject: EncryptedData = JSON.parse(encryptedValue as string);
        const decrypted = await decryptData(encryptedDataObject, encryptionKey);
        this.metadata[field] = decrypted;
      } catch (error) {
        // Log decryption failure but don't break the flow
        // Security: no sensitive data in logs
      }
    }
  }
  return this;
};

// =============================================================================
// Static Methods
// =============================================================================

auditLogSchema.statics.findWithFilters = function(filters: any, options: any = {}) {
  const query = this.find();
  
  // Apply filters
  if (filters.category) {
    if (Array.isArray(filters.category)) {
      query.where('category').in(filters.category);
    } else {
      query.where('category').equals(filters.category);
    }
  }
  
  if (filters.severity) {
    if (Array.isArray(filters.severity)) {
      query.where('severity').in(filters.severity);
    } else {
      query.where('severity').equals(filters.severity);
    }
  }
  
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query.where('status').in(filters.status);
    } else {
      query.where('status').equals(filters.status);
    }
  }
  
  if (filters.userId) {
    query.where('userId').equals(filters.userId);
  }
  
  if (filters.adminId) {
    query.where('adminId').equals(filters.adminId);
  }
  
  if (filters.ipHash) {
    query.where('ipHash').equals(filters.ipHash);
  }
  
  if (filters.action) {
    query.where('action').regex(new RegExp(filters.action, 'i'));
  }
  
  if (filters.dateFrom || filters.dateTo) {
    const dateQuery: any = {};
    if (filters.dateFrom) dateQuery.$gte = filters.dateFrom;
    if (filters.dateTo) dateQuery.$lte = filters.dateTo;
    query.where('timestamp').where(dateQuery);
  }
  
  if (filters.search) {
    query.where({ $text: { $search: filters.search } });
  }
  
  // Sorting
  const sortBy = filters.sortBy || 'timestamp';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
  query.sort({ [sortBy]: sortOrder });
  
  // Pagination
  if (filters.limit) {
    query.limit(filters.limit);
  }
  if (filters.offset) {
    query.skip(filters.offset);
  }
  
  return query;
};

auditLogSchema.statics.getStats = async function(timeRange?: string) {
  const now = new Date();
  let startDate: Date;
  
  switch (timeRange) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        bySeverity: {
          $push: '$severity'
        },
        byCategory: {
          $push: '$category'
        },
        securityEvents: {
          $sum: { $cond: [{ $eq: ['$category', 'security_event'] }, 1, 0] }
        },
        criticalEvents: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        }
      }
    }
  ];
  
  const [stats] = await this.aggregate(pipeline);
  return stats || {
    totalLogs: 0,
    bySeverity: [],
    byCategory: [],
    securityEvents: 0,
    criticalEvents: 0
  };
};

// =============================================================================
// Audit Alert Schema
// =============================================================================

const auditAlertSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  enabled: {
    type: Boolean,
    default: true
  },
  conditions: {
    category: [String],
    severity: [String],
    action: [String],
    threshold: {
      count: Number,
      timeWindow: Number
    }
  },
  notifications: {
    email: [String],
    webhook: String,
    inApp: Boolean
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'audit_alerts'
});

// =============================================================================
// Audit Retention Policy Schema
// =============================================================================

const auditRetentionPolicySchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'user_action',
      'admin_action',
      'security_event',
      'system_event',
      'data_access',
      'file_operation',
      'auth_event',
      'compliance'
    ],
    unique: true
  },
  retentionDays: {
    type: Number,
    required: true,
    min: 1,
    max: 2555 // 7 years max
  },
  autoArchive: {
    type: Boolean,
    default: false
  },
  archiveLocation: {
    type: String,
    enum: ['s3', 'glacier', 'local']
  },
  encryptArchive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'audit_retention_policies'
});

// =============================================================================
// Helper Functions
// =============================================================================

function getRetentionDaysForCategory(category: AuditCategory): number {
  const defaultRetention: Record<AuditCategory, number> = {
    'user_action': 365,      // 1 year
    'admin_action': 2555,    // 7 years (regulatory requirement)
    'security_event': 2555,  // 7 years
    'system_event': 90,      // 3 months
    'data_access': 2555,     // 7 years (GDPR requirement)
    'file_operation': 365,   // 1 year
    'auth_event': 365,       // 1 year
    'compliance': 2555       // 7 years
  };
  
  return defaultRetention[category] || 365;
}

// =============================================================================
// Model Exports
// =============================================================================

export const AuditLog: Model<IAuditLogDocument> = mongoose.models.AuditLog || 
  mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);

export const AuditAlert: Model<IAuditAlertDocument> = mongoose.models.AuditAlert || 
  mongoose.model<IAuditAlertDocument>('AuditAlert', auditAlertSchema);

export const AuditRetentionPolicy: Model<IAuditRetentionPolicyDocument> = mongoose.models.AuditRetentionPolicy || 
  mongoose.model<IAuditRetentionPolicyDocument>('AuditRetentionPolicy', auditRetentionPolicySchema);

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create default retention policies
 */
export async function createDefaultRetentionPolicies() {
  const categories: AuditCategory[] = [
    'user_action',
    'admin_action',
    'security_event',
    'system_event',
    'data_access',
    'file_operation',
    'auth_event',
    'compliance'
  ];
  
  for (const category of categories) {
    await AuditRetentionPolicy.findOneAndUpdate(
      { category },
      {
        category,
        retentionDays: getRetentionDaysForCategory(category),
        autoArchive: false,
        encryptArchive: true
      },
      { upsert: true }
    );
  }
}

/**
 * Initialize audit system
 */
export async function initializeAuditSystem() {
  try {
    await createDefaultRetentionPolicies();
    console.log('✅ Audit system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize audit system:', error);
    throw error;
  }
}
