/**
 * 🔧 Log Admin Action Use Case
 * 
 * Records administrative actions for audit and accountability.
 * Privacy-compliant: Only logs action metadata, no personal data.
 * 
 * @domain admin
 * @pattern Use Case (DDD)
 * @privacy zero-knowledge - audit trail without privacy violations
 */

import { AdminAction } from '../../domain/entities/AdminAction.entity';
import { AdminUserId } from '../../domain/value-objects/AdminUserId.vo';
import { ActionType } from '../../domain/value-objects/ActionType.vo';
import { IAdminActionRepository } from '../../domain/repositories/IAdminActionRepository';

/**
 * Request to log an admin action
 */
export interface LogAdminActionRequest {
  readonly adminUserId: string;
  readonly actionType: ActionType;
  readonly targetType: 'user' | 'file' | 'system';
  readonly targetId?: string;
  readonly reason?: string;
  readonly metadata?: Record<string, any>;
  readonly ipAddress?: string; // Will be hashed for privacy
}

/**
 * Response from logging an admin action
 */
export interface LogAdminActionResponse {
  readonly actionId: string;
  readonly timestamp: Date;
  readonly success: boolean;
}

/**
 * Use case for logging administrative actions
 */
export class LogAdminActionUseCase {
  constructor(
    private readonly adminActionRepository: IAdminActionRepository
  ) { }

  /**
   * Execute the use case to log an admin action
   */
  async execute(request: LogAdminActionRequest): Promise<LogAdminActionResponse> {
    try {
      // 1. Validate input
      this.validateRequest(request);

      // 2. Create admin user ID
      const adminUserId = AdminUserId.fromString(request.adminUserId);

      // 3. Create admin action entity
      const adminAction = AdminAction.create(
        adminUserId,
        request.actionType,
        request.targetType,
        {
          targetId: request.targetId,
          reason: request.reason,
          metadata: this.sanitizeMetadata(request.metadata),
          ipAddress: request.ipAddress
        }
      );

      // 4. Save to repository
      await this.adminActionRepository.save(adminAction);

      // 5. Return success response
      return {
        actionId: adminAction.id,
        timestamp: adminAction.timestamp,
        success: true
      };

    } catch (error) {
      throw new Error(`Failed to log admin action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate the request data
   */
  private validateRequest(request: LogAdminActionRequest): void {
    if (!request.adminUserId) {
      throw new Error('Admin user ID is required');
    }

    if (!request.actionType) {
      throw new Error('Action type is required');
    }

    if (!request.targetType) {
      throw new Error('Target type is required');
    }

    // Validate that emergency actions have a reason
    if (request.actionType.isEmergencyAction() && !request.reason) {
      throw new Error('Emergency actions must include a reason');
    }

    // Validate that privacy actions have proper metadata
    if (request.actionType.isPrivacyAction() && !request.metadata?.complianceReason) {
      throw new Error('Privacy/compliance actions must include compliance reason');
    }
  }

  /**
   * Sanitize metadata to ensure no sensitive data is stored
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) {
      return undefined;
    }

    // List of fields that should be removed for privacy
    const sensitiveFields = [
      'password', 'email', 'personalInfo', 'userData',
      'creditCard', 'ssn', 'phoneNumber', 'address'
    ];

    const sanitized = { ...metadata };

    // Remove sensitive fields
    sensitiveFields.forEach(field => {
      delete sanitized[field];
    });

    // Ensure metadata is not too large (prevent DoS)
    const metadataString = JSON.stringify(sanitized);
    if (metadataString.length > 10000) { // 10KB limit
      throw new Error('Metadata too large (max 10KB)');
    }

    return sanitized;
  }
}
