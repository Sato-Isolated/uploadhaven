/**
 * Component Props and UI State Types for UploadHaven
 * Handles component properties, modal states, and UI interactions
 */

// =============================================================================
// Base Component Props
// =============================================================================

/**
 * Base props for all components
 */
export interface BaseComponentProps {
  className?: string;
  loading?: boolean;
  error?: string | null;
}

/**
 * Props for components with data
 */
export interface DataComponentProps<T> extends BaseComponentProps {
  data?: T;
  onRefresh?: () => void;
}

/**
 * Props for components with actions
 */
export interface ActionComponentProps extends BaseComponentProps {
  onAction?: () => void;
  actionLoading?: boolean;
  disabled?: boolean;
}

// =============================================================================
// Modal and UI State
// =============================================================================

/**
 * Modal state management
 */
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

/**
 * Modal state for hooks
 */
export interface HookModalState {
  isOpen: boolean;
  data?: unknown;
}

/**
 * Modal hook return type
 */
export interface UseModalReturn {
  isOpen: boolean;
  data: unknown;
  openModal: (data?: unknown) => void;
  closeModal: () => void;
  toggleModal: (data?: unknown) => void;
}

/**
 * Loading state for UI components
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  loading?: boolean; // For backward compatibility
  error?: string | null; // For backward compatibility
}

/**
 * Async operation state
 */
export interface AsyncOperationState {
  loading: boolean;
  error: string | null;
}

/**
 * Async operation options
 */
export interface AsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
