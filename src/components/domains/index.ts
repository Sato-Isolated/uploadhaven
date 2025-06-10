// Domain-based component exports
// Centralized exports for clean imports across the application

// Admin Domain
export { default as AdminAnalytics } from "./admin/analytics";
export { default as AdminDashboard } from "./admin/dashboard";
export { default as AdminUserList } from "./admin/users";
export { default as FilesTable } from "./admin/filestable";

// Analytics Domain
export { default as UserAnalytics } from "./analytics/user";

// Auth Domain
export { default as SignInForm } from "./auth/signin";
export { default as SignUpForm } from "./auth/signup";

// Dashboard Domain
export { default as Dashboard } from "./dashboard/client";
export { default as DashboardClient } from "./dashboard/client/DashboardClient";
export { default as DashboardUploadArea } from "./dashboard/upload";
export { default as ClientUserStats } from "./dashboard/stats";

// Files Domain
export { default as FileManager } from "./files/manager";
export { default as FilePreviewClient } from "./filepreview";

// Security Domain
export { default as SecurityPanel } from "./security/panel";
export { default as SecurityEventsList } from "./security/events";
export { default as SecurityScanModal } from "./security/SecurityScanModal";

// Stats Domain
export { default as StatsPanel } from "./stats/panel";

// Upload Domain
export { default as FileUploader } from "./upload/fileuploader";

// Activity Domain
export { default as RecentActivity } from "./activity";
