/**
 * API Service Layer - Lean Service Aggregator
 * 
 * Provides a clean API for accessing domain services.
 * Each service is focused and handles only its domain responsibilities.
 * 
 * @architecture DDD Service Layer
 * @pattern Service Aggregator + Facade
 */

import { FileService } from '../services/file.service';
import { UserService } from '../services/user.service';
import { SecurityService } from '../services/security.service';
import { AdminService } from '../services/admin.service';
import { SystemService } from '../services/system.service';

/**
 * API Services Aggregator
 * 
 * Provides a clean interface to all domain services.
 * Each service is a separate class focused on its domain.
 */
export class ApiServices {

  /**
   * File Operations Service
   * Handles file upload/download operations
   */
  static fileService = FileService;

  /**
   * User Management Service
   * Handles user registration and authentication
   */
  static userService = UserService;

  /**
   * Security & Privacy Service
   * Handles security monitoring and logging
   */
  static securityService = SecurityService;

  /**
   * Admin Service
   * Handles admin operations and statistics
   */
  static adminService = AdminService;

  /**
   * System Service
   * Handles system health and monitoring
   */
  static systemService = SystemService;
}

/**
 * Convenience exports for API routes
 */
export { FileService } from '../services/file.service';
export { UserService } from '../services/user.service';
export { SecurityService } from '../services/security.service';
export { AdminService } from '../services/admin.service';
export { SystemService } from '../services/system.service';
