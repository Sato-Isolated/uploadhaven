/**
 * 🔧 Admin Domain Integration Test
 * 
 * Tests for the admin domain including entities, value objects, and use cases.
 * Ensures privacy-compliant admin action logging and audit functionality.
 * 
 * @domain admin
 * @pattern Integration Test (DDD)
 * @privacy zero-knowledge - no sensitive data in tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminAction } from '../domain/entities/AdminAction.entity';
import { AdminActionId } from '../domain/value-objects/AdminActionId.vo';
import { AdminUserId } from '../domain/value-objects/AdminUserId.vo';
import { ActionType, ADMIN_ACTION_TYPES } from '../domain/value-objects/ActionType.vo';
import { LogAdminActionUseCase } from '../application/usecases/LogAdminAction.usecase';
import { IAdminActionRepository } from '../domain/repositories/IAdminActionRepository';

// Mock repository implementation for testing
class MockAdminActionRepository implements IAdminActionRepository {
  private actions: AdminAction[] = [];

  async save(action: AdminAction): Promise<void> {
    this.actions.push(action);
  }

  async findById(id: AdminActionId): Promise<AdminAction | null> {
    return this.actions.find(action => action.id === id.value) || null;
  }

  async findByFilters(): Promise<AdminAction[]> {
    return this.actions;
  }

  async findByAdminUserId(): Promise<AdminAction[]> {
    return this.actions;
  }

  async findByTarget(): Promise<AdminAction[]> {
    return this.actions;
  }

  async findRecentActions(): Promise<AdminAction[]> {
    return this.actions;
  }

  async getStatistics() {
    return {
      totalActions: this.actions.length,
      actionsByType: {},
      actionsByAdmin: {},
      recentActions: 0
    };
  }

  async count(): Promise<number> {
    return this.actions.length;
  }

  async deleteOlderThan(): Promise<number> {
    return 0;
  }

  async hasRecentAction(): Promise<boolean> {
    return false;
  }

  async findActionsPendingFollowUp(): Promise<AdminAction[]> {
    return [];
  }

  async bulkSave(): Promise<void> {
    // Mock implementation
  }

  async findByDateRange(): Promise<AdminAction[]> {
    return this.actions;
  }

  async getActionFrequency(): Promise<number> {
    return 0;
  }

  // Helper method for testing
  getStoredActions(): AdminAction[] {
    return this.actions;
  }

  clear(): void {
    this.actions = [];
  }
}

describe('Admin Domain', () => {
  let mockRepository: MockAdminActionRepository;
  let logAdminActionUseCase: LogAdminActionUseCase;

  beforeEach(() => {
    mockRepository = new MockAdminActionRepository();
    logAdminActionUseCase = new LogAdminActionUseCase(mockRepository);
  });

  describe('AdminActionId Value Object', () => {
    it('should generate valid admin action ID', () => {
      const id = AdminActionId.generate();
      expect(id.value).toBeDefined();
      expect(id.value.length).toBeGreaterThanOrEqual(8);
      expect(id.value.length).toBeLessThanOrEqual(20);
    });

    it('should create from valid string', () => {
      const validId = 'admin_action_123';
      const id = AdminActionId.fromString(validId);
      expect(id.value).toBe(validId);
    });

    it('should reject invalid formats', () => {
      expect(() => AdminActionId.fromString('')).toThrow();
      expect(() => AdminActionId.fromString('x')).toThrow();
      expect(() => AdminActionId.fromString('invalid@chars')).toThrow();
    });

    it('should support equality comparison', () => {
      const id1 = AdminActionId.fromString('test_action_123');
      const id2 = AdminActionId.fromString('test_action_123');
      const id3 = AdminActionId.fromString('different_action');

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });

  describe('AdminUserId Value Object', () => {
    it('should generate valid UUID', () => {
      const userId = AdminUserId.generate();
      expect(userId.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create system admin ID', () => {
      const systemAdmin = AdminUserId.createSystemAdmin();
      expect(systemAdmin.value).toMatch(/^system-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(systemAdmin.isSystemAdmin()).toBe(true);
    });

    it('should identify system admin correctly', () => {
      const normalAdmin = AdminUserId.generate();
      const systemAdmin = AdminUserId.createSystemAdmin();

      expect(normalAdmin.isSystemAdmin()).toBe(false);
      expect(systemAdmin.isSystemAdmin()).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(() => AdminUserId.fromString('invalid-uuid')).toThrow();
      expect(() => AdminUserId.fromString('')).toThrow();
    });
  });

  describe('ActionType Value Object', () => {
    it('should create valid action types', () => {
      const fileDelete = ActionType.fileDelete();
      const userSuspend = ActionType.userSuspend();
      const emergency = ActionType.emergencyShutdown();

      expect(fileDelete.value).toBe(ADMIN_ACTION_TYPES.FILE_DELETE);
      expect(userSuspend.value).toBe(ADMIN_ACTION_TYPES.USER_SUSPEND);
      expect(emergency.value).toBe(ADMIN_ACTION_TYPES.EMERGENCY_SHUTDOWN);
    });

    it('should categorize action types correctly', () => {
      const fileAction = ActionType.fileDelete();
      const userAction = ActionType.userSuspend();
      const systemAction = ActionType.systemMaintenance();
      const emergencyAction = ActionType.emergencyShutdown();
      const privacyAction = ActionType.gdprDataDelete();

      expect(fileAction.isFileAction()).toBe(true);
      expect(fileAction.isUserAction()).toBe(false);

      expect(userAction.isUserAction()).toBe(true);
      expect(userAction.isFileAction()).toBe(false);

      expect(systemAction.isSystemAction()).toBe(true);
      expect(emergencyAction.isEmergencyAction()).toBe(true);
      expect(privacyAction.isPrivacyAction()).toBe(true);
    });

    it('should provide human-readable descriptions', () => {
      const fileDelete = ActionType.fileDelete();
      const description = fileDelete.getDescription();

      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(0);
      expect(description).toContain('Delete');
    });

    it('should validate action types', () => {
      expect(() => ActionType.fromString('invalid_action')).toThrow();
      expect(() => ActionType.fromString('')).toThrow();
    });

    it('should list all valid types', () => {
      const allTypes = ActionType.getAllTypes();
      expect(allTypes).toContain(ADMIN_ACTION_TYPES.FILE_DELETE);
      expect(allTypes).toContain(ADMIN_ACTION_TYPES.USER_SUSPEND);
      expect(allTypes).toContain(ADMIN_ACTION_TYPES.EMERGENCY_SHUTDOWN);
    });
  });

  describe('AdminAction Entity', () => {
    it('should create admin action with required fields', () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.fileDelete();

      const action = AdminAction.create(
        adminUserId,
        actionType,
        'file',
        {
          targetId: 'file_123',
          reason: 'Inappropriate content',
          metadata: { reportId: 'report_456' }
        }
      );

      expect(action.id).toBeDefined();
      expect(action.adminUserId).toBe(adminUserId.value);
      expect(action.actionType).toBe(actionType);
      expect(action.targetType).toBe('file');
      expect(action.targetId).toBe('file_123');
      expect(action.reason).toBe('Inappropriate content');
      expect(action.metadata).toEqual({ reportId: 'report_456' });
      expect(action.timestamp).toBeInstanceOf(Date);
    });

    it('should hash IP address for privacy', () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.userSuspend();

      const action = AdminAction.create(
        adminUserId,
        actionType,
        'user',
        {
          targetId: 'user_123',
          ipAddress: '192.168.1.100'
        }
      );

      expect(action.ipHash).toBeDefined();
      expect(action.ipHash).not.toBe('192.168.1.100');
      expect(action.ipHash?.length).toBe(64); // SHA-256 hex length
    });

    it('should support business logic methods', () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.fileDelete();

      const action = AdminAction.create(
        adminUserId,
        actionType,
        'file',
        {
          targetId: 'file_123',
          reason: 'Test deletion'
        }
      );

      expect(action.affectsTarget('file_123')).toBe(true);
      expect(action.affectsTarget('file_456')).toBe(false);
      expect(action.performedBy(adminUserId.value)).toBe(true);

      const summary = action.getAuditSummary();
      expect(summary.id).toBe(action.id);
      expect(summary.action).toBe(actionType.value);
      expect(summary.hasReason).toBe(true);
    });

    it('should convert to and from data format', () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.systemMaintenance();

      const originalAction = AdminAction.create(
        adminUserId,
        actionType,
        'system',
        {
          reason: 'Scheduled maintenance',
          metadata: { duration: '2 hours' }
        }
      );

      const data = originalAction.toData();
      const reconstructedAction = AdminAction.fromData(data);

      expect(reconstructedAction.id).toBe(originalAction.id);
      expect(reconstructedAction.adminUserId).toBe(originalAction.adminUserId);
      expect(reconstructedAction.actionType.value).toBe(originalAction.actionType.value);
      expect(reconstructedAction.targetType).toBe(originalAction.targetType);
      expect(reconstructedAction.reason).toBe(originalAction.reason);
      expect(reconstructedAction.metadata).toEqual(originalAction.metadata);
    });
  });

  describe('LogAdminAction Use Case', () => {
    it('should log admin action successfully', async () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.fileDelete();

      const request = {
        adminUserId: adminUserId.value,
        actionType,
        targetType: 'file' as const,
        targetId: 'file_123',
        reason: 'Inappropriate content',
        metadata: { reportId: 'report_456' },
        ipAddress: '192.168.1.100'
      };

      const response = await logAdminActionUseCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.actionId).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);

      const storedActions = mockRepository.getStoredActions();
      expect(storedActions).toHaveLength(1);
      expect(storedActions[0].adminUserId).toBe(adminUserId.value);
      expect(storedActions[0].targetId).toBe('file_123');
    });

    it('should require reason for emergency actions', async () => {
      const adminUserId = AdminUserId.generate();
      const emergencyAction = ActionType.emergencyShutdown();

      const requestWithoutReason = {
        adminUserId: adminUserId.value,
        actionType: emergencyAction,
        targetType: 'system' as const
      };

      await expect(logAdminActionUseCase.execute(requestWithoutReason))
        .rejects.toThrow('Emergency actions must include a reason');
    });

    it('should require compliance reason for privacy actions', async () => {
      const adminUserId = AdminUserId.generate();
      const privacyAction = ActionType.gdprDataDelete();

      const requestWithoutCompliance = {
        adminUserId: adminUserId.value,
        actionType: privacyAction,
        targetType: 'user' as const,
        targetId: 'user_123',
        metadata: { someField: 'value' } // Missing complianceReason
      };

      await expect(logAdminActionUseCase.execute(requestWithoutCompliance))
        .rejects.toThrow('Privacy/compliance actions must include compliance reason');
    });

    it('should sanitize metadata by removing sensitive fields', async () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.userSuspend();

      const request = {
        adminUserId: adminUserId.value,
        actionType,
        targetType: 'user' as const,
        targetId: 'user_123',
        metadata: {
          validField: 'safe data',
          password: 'secret123', // Should be removed
          email: 'user@example.com', // Should be removed
          personalInfo: 'sensitive', // Should be removed
          reportId: 'report_789' // Should be kept
        }
      };

      await logAdminActionUseCase.execute(request);

      const storedActions = mockRepository.getStoredActions();
      const storedMetadata = storedActions[0].metadata;

      expect(storedMetadata).toHaveProperty('validField');
      expect(storedMetadata).toHaveProperty('reportId');
      expect(storedMetadata).not.toHaveProperty('password');
      expect(storedMetadata).not.toHaveProperty('email');
      expect(storedMetadata).not.toHaveProperty('personalInfo');
    });

    it('should reject oversized metadata', async () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.systemMaintenance();

      // Create large metadata (>10KB)
      const largeMetadata: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeMetadata[`field_${i}`] = 'x'.repeat(50);
      }

      const request = {
        adminUserId: adminUserId.value,
        actionType,
        targetType: 'system' as const,
        metadata: largeMetadata
      };

      await expect(logAdminActionUseCase.execute(request))
        .rejects.toThrow('Metadata too large');
    });

    it('should validate required fields', async () => {
      const invalidRequests = [
        { actionType: ActionType.fileDelete(), targetType: 'file' as const }, // Missing adminUserId
        { adminUserId: 'admin_123', targetType: 'file' as const }, // Missing actionType
        { adminUserId: 'admin_123', actionType: ActionType.fileDelete() } // Missing targetType
      ];

      for (const request of invalidRequests) {
        await expect(logAdminActionUseCase.execute(request as any))
          .rejects.toThrow();
      }
    });
  });

  describe('Privacy Compliance', () => {
    it('should not store personal data in admin actions', async () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.userSuspend();

      const request = {
        adminUserId: adminUserId.value,
        actionType,
        targetType: 'user' as const,
        targetId: 'user_123',
        reason: 'Violation of terms',
        ipAddress: '192.168.1.100'
      };

      await logAdminActionUseCase.execute(request);

      const storedActions = mockRepository.getStoredActions();
      const action = storedActions[0];
      const data = action.toData();

      // Verify no personal data is stored
      const dataString = JSON.stringify(data);
      expect(dataString).not.toContain('192.168.1.100'); // IP should be hashed
      expect(action.ipHash).toBeDefined();
      expect(action.ipHash).not.toBe('192.168.1.100');
    });

    it('should maintain audit trail without sensitive data', () => {
      const adminUserId = AdminUserId.generate();
      const actionType = ActionType.auditLogExport();

      const action = AdminAction.create(
        adminUserId,
        actionType,
        'system',
        {
          reason: 'Monthly audit report',
          metadata: {
            requestedBy: 'admin_456',
            format: 'CSV',
            dateRange: '2024-01-01 to 2024-01-31'
          }
        }
      );

      const summary = action.getAuditSummary();

      expect(summary).toHaveProperty('id');
      expect(summary).toHaveProperty('action');
      expect(summary).toHaveProperty('targetType');
      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('hasReason');

      // Verify summary doesn't expose sensitive metadata
      expect(summary).not.toHaveProperty('metadata');
      expect(summary).not.toHaveProperty('ipHash');
    });
  });
});
