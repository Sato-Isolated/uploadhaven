// Re-export all custom hooks for easy importing
export { useApi } from "./useApi";
export { usePagination } from "./usePagination";
export { useFileOperations } from "./useFileOperations";
export { usePolling, usePollingApi } from "./usePolling";
export { useModal, useModals } from "./useModal";
export { useAsyncOperation } from "./useAsyncOperation";

export {
  useLocalStorage,
  useUploadedFiles,
  useUserPreferences,
} from "./useLocalStorage";

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
