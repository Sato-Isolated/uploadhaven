// Domain-based component exports
// Centralized exports for clean imports across the application

// Admin Domain
export { default as AdminAnalytics } from "./admin/analytics";
export { default as AdminDashboard } from "./admin/dashboard";
export { default as AdminUserList } from "./admin/users";

// Analytics Domain
export { default as UserAnalytics } from "./analytics/user";

// Auth Domain
export { default as SignInForm } from "./auth/signin";
export { default as SignUpForm } from "./auth/signup";

// Dashboard Domain
export { DashboardClient as Dashboard } from "./dashboard/client";
export { DashboardClient } from "./dashboard/client";

// Files Domain
export { default as FileManager } from "./files/manager";
export { FilePreviewClient } from "./filepreview";

// Security Domain
export { default as SecurityPanel } from "./security/panel";
export { default as SecurityScanModal } from "./security/SecurityScanModal";

// Stats Domain
export { default as StatsPanel } from "./stats/panel";

// Upload Domain
export { default as FileUploader } from "./upload/fileuploader";

// Activity Domain
