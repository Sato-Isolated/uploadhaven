// Re-export all custom hooks for easy importing

export { useFileOperations } from './useFileOperations';
export { useModal, useModals } from './useModal';
export { useAsyncOperation } from './useAsyncOperation';
export { useOrigin } from './useOrigin';
export { useClientDecryption } from './useClientDecryption';
export { useStatsQuery } from './useStatsQuery';
export { useUserAnalytics } from './useUserAnalytics';
export {
  useActivitiesQuery,
  useInfiniteActivitiesQuery,
} from './useActivitiesQuery';
export { useActivityManagement } from './useActivityManagement';
export {
  useSecurityData,
  useExportSecurityLogs,
  useClearSecurityLogs,
} from './useSecurityQuery';
export {
  useFiles,
  useFile,
  useDeleteFile,
  useDeleteFiles,
  useUploadFile,
} from './useFilesQuery';
export { useLogUserActivity } from './useUserActivity';
export { useDashboardUpload } from '../components/domains/dashboard/upload/hooks/useDashboardUpload';
export { useSignUpForm } from '../components/domains/auth/signup/hooks/useSignUpForm';
export { useSignInForm } from '../components/domains/auth/signin/hooks/useSignInForm';
export { useFilesTableLogic } from '../components/domains/admin/filestable/hooks/useFilesTableLogic';
export { useFileUploader } from '../components/domains/upload/fileuploader/hooks/useFileUploader';
// Notification hooks - focused and SRP-compliant
export {
  useNotificationQuery,
  useNotificationMutations,
  useNotificationRealtime,
  useNotificationStats,
  useNotificationConnection,
  useNotifications,
  useSecurityNotifications,
  useFileNotifications,
  useSystemNotifications,
  useNotificationUI,
  useNotificationFilters,
} from './notifications';
// Real-time hooks using polling (preferred approach)
export { useRealTimeActivities } from './useRealTimePolling';

export type {
  ApiState,
  ApiOptions,
  PaginationState,
  UsePaginationOptions,
  FileUploadOptions,
  FileDeleteOptions,
  PollingOptions,
  HookModalState as ModalState,
  UseModalReturn,
  AsyncOperationState,
  AsyncOperationOptions,
} from '@/types';
