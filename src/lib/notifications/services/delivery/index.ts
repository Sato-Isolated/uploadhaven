// Notification Delivery Services - Focused and SRP-compliant exports

export { RealTimeDeliveryService } from './real-time-delivery';
export { EmailDeliveryService } from './email-delivery';

// Types for delivery services
export type DeliveryMethod = 'realtime' | 'email' | 'batch';

export interface DeliveryResult {
  success: boolean;
  deliveredCount: number;
  failedCount: number;
  errors: string[];
}

export interface DeliveryOptions {
  method: DeliveryMethod;
  recipients: string[];
  priority?: 'low' | 'normal' | 'high';
  batchSize?: number;
  template?: string;
}
