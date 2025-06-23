/**
 * 📚 Shared Presentation Exports
 * 
 * Centralized exports for the shared presentation layer.
 * Makes imports cleaner throughout the DDD architecture.
 */

// Core utilities
export { cn, designTokens, privacyStates, a11y, animations } from './utils';
export type { PrivacyState, DesignToken } from './utils';

// Icon components
export {
  ShieldCheckIcon,
  KeyIcon,
  ClockIcon,
  UserSecretIcon,
  UploadIcon,
  LoadingIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  Icons
} from './icons';

// UI components
export {
  Button,
  buttonVariants,
  Input,
  Progress,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  badgeVariants
} from './components';

export type { ButtonProps, InputProps, BadgeProps } from './components';
