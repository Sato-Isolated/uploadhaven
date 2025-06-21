// UploadHaven Notification System - Complete SRP-Compliant Module
// Comprehensive exports for the refactored notification system

// =============================================================================
// DOMAIN LAYER - Core types, constants, and business rules
// =============================================================================
export * from './domain/types';
export * from './domain/constants';
export * from './domain/errors';

// =============================================================================
// REPOSITORY LAYER - Data access and persistence
// =============================================================================
export { NotificationRepository } from './repository/notification-repository';

// =============================================================================
// SERVICE LAYER - Business logic and orchestration
// =============================================================================
export * from './services';

// =============================================================================
// ADAPTER LAYER - Type compatibility and migration support
// =============================================================================
export * from './adapters';

// =============================================================================
// HOOKS LAYER - React integration and state management
// =============================================================================
// Note: These are exported from src/hooks/notifications/index.ts
// Available hooks:
// - useNotificationQuery (data fetching)
// - useNotificationMutations (CRUD operations)
// - useNotificationRealtime (SSE/real-time updates)
// - useNotificationStats (statistics)
// - useNotificationConnection (connection state)
// - useNotifications (main orchestration hook)
// - useSecurityNotifications (security-specific)
// - useFileNotifications (file-specific)
// - useSystemNotifications (system-specific)
// - useNotificationUI (UI state management)
// - useNotificationFilters (filter state management)

// =============================================================================
// UI COMPONENTS - Focused, reusable React components
// =============================================================================
// Note: These are exported from src/components/domains/notifications/index.ts
// Available components:
// - NotificationList (list container)
// - NotificationItem (individual notification)
// - NotificationIcon (type-specific icons)
// - NotificationActions (action buttons)
// - NotificationFilters (filtering controls)
// - NotificationBadge (unread count indicator)

// =============================================================================
// USAGE EXAMPLES
// =============================================================================
/*
// Basic notification hooks usage:
import { useNotifications, useNotificationStats } from '@/hooks/notifications';

function NotificationDemo() {
  const { notifications, isLoading, markAsRead, deleteNotification } = useNotifications({
    limit: 10,
    includeRead: false,
    realtime: true,
  });
  
  const { stats } = useNotificationStats();
  
  return (
    <div>
      <p>Unread: {stats?.unread || 0}</p>
      {notifications.map(notification => (
        <div key={notification.id}>
          <p>{notification.title}</p>
          <button onClick={() => markAsRead(notification.id)}>Mark as read</button>
        </div>
      ))}
    </div>
  );
}

// UI components usage:
import { 
  NotificationList, 
  NotificationBadge, 
  NotificationFilters 
} from '@/components/domains/notifications';

function NotificationInterface() {
  const { notifications, stats, markAsRead, deleteNotification } = useNotifications();
  const { selectedTypes, selectedPriorities, includeRead, ...filterHandlers } = useNotificationFilters();
  
  return (
    <div>
      <NotificationBadge count={stats?.unread || 0} />
      <NotificationFilters
        selectedTypes={selectedTypes}
        selectedPriorities={selectedPriorities}
        includeRead={includeRead}
        {...filterHandlers}
      />
      <NotificationList
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />
    </div>
  );
}

// Service layer usage:
import { NotificationService, NotificationFactory } from '@/lib/notifications';

async function createSecurityNotification(userId: string, details: string) {
  const notificationData = NotificationFactory.createSecurityAlert({
    userId,
    title: 'Security Alert',
    message: details,
    priority: 'urgent',
  });
  
  const service = new NotificationService(repository, validator, broadcaster);
  return await service.createNotification(notificationData);
}
*/

// =============================================================================
// ARCHITECTURE SUMMARY
// =============================================================================
/*
The notification system now follows strict Single Responsibility Principle:

📁 DOMAIN LAYER
├── types.ts          - Core types and interfaces
├── constants.ts      - Configuration and defaults
└── errors.ts         - Domain-specific errors

📁 REPOSITORY LAYER
└── notification-repository.ts - Data access operations

📁 SERVICE LAYER
├── notification-service.ts     - Core business logic
├── notification-factory.ts     - Entity creation
├── notification-validator.ts   - Input validation
└── delivery/
    ├── real-time-delivery.ts   - SSE broadcasting
    ├── email-delivery.ts       - Email notifications
    └── index.ts                - Delivery exports

📁 HOOKS LAYER
├── useNotificationQuery.ts     - Data fetching
├── useNotificationMutations.ts - CRUD operations
├── useNotificationRealtime.ts  - Real-time updates
├── useNotificationStats.ts     - Statistics
├── useNotificationConnection.ts- Connection state
├── useNotifications.ts         - Main orchestration
├── useSecurityNotifications.ts - Security-specific
├── useFileNotifications.ts     - File-specific
├── useSystemNotifications.ts   - System-specific
├── useNotificationUI.ts        - UI state
├── useNotificationFilters.ts   - Filter state
└── index.ts                    - Hook exports

📁 UI COMPONENTS LAYER
├── display/
│   ├── NotificationList.tsx    - List container
│   ├── NotificationItem.tsx    - Individual item
│   └── NotificationIcon.tsx    - Type icons
├── actions/
│   └── NotificationActions.tsx - Action buttons
├── filters/
│   └── NotificationFilters.tsx - Filter controls
├── indicators/
│   └── NotificationBadge.tsx   - Unread badge
└── index.ts                    - Component exports

Each module has a single, focused responsibility making the system:
✅ Maintainable - Easy to understand and modify
✅ Testable - Each module can be tested in isolation
✅ Scalable - New features can be added without affecting existing code
✅ Reusable - Components and hooks can be used across different contexts
*/
