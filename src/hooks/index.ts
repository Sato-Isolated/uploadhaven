// Re-export all custom hooks for easy importing

export { useFileOperations } from "./useFileOperations";
export { useModal, useModals } from "./useModal";
export { useAsyncOperation } from "./useAsyncOperation";
export { useStatsQuery } from "./useStatsQuery";
export { useUserAnalytics } from "./useUserAnalytics";
export { useActivitiesQuery, useInfiniteActivitiesQuery } from "./useActivitiesQuery";
export { useSecurityData, useExportSecurityLogs, useClearSecurityLogs, useSecurityScan } from "./useSecurityQuery";
export { useFiles, useFile, useDeleteFile, useDeleteFiles, useUploadFile } from "./useFilesQuery";
export { useLogUserActivity } from "./useUserActivity";
export { useTextPreview, useFilePreview } from "./useFilePreview";
// Real-time hooks using polling (preferred approach)
export { useRealTimeActivities, useRealTimeStats, useRealTimeFiles, useRealTimeData } from "./useRealTimePolling";


export { useToast } from "./useToast";

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
} from "@/components/types/common";
