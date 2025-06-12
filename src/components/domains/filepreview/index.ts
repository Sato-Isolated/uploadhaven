// Main components
export { default as FilePreviewClient } from './FilePreviewClient';
export { default as FilePreview } from './FilePreview';

// Preview components
export { default as AudioPreview } from './components/AudioPreview';
export { default as FallbackPreview } from './components/FallbackPreview';
export { default as FileActions } from './components/FileActions';
export { default as FileHeader } from './components/FileHeader';
export { FileIcon } from './components/FileIcon';
export { default as FileInfo } from './components/FileInfo';
export { default as ImagePreview } from './components/ImagePreview';
export { default as PDFPreview } from './components/PDFPreview';
export { default as TextPreview } from './components/TextPreview';
export { default as VideoPreview } from './components/VideoPreview';

// Existing components
export { FilePreviewActions } from './components/FilePreviewActions';
export { FilePreviewDetails } from './components/FilePreviewDetails';
export { FilePreviewErrorState } from './components/FilePreviewErrorState';
export { FilePreviewHeader } from './components/FilePreviewHeader';
export { FilePreviewLoadingState } from './components/FilePreviewLoadingState';
export { FilePreviewNoFileState } from './components/FilePreviewNoFileState';
export { FilePreviewPasswordForm } from './components/FilePreviewPasswordForm';
export { FilePreviewSecurityNotice } from './components/FilePreviewSecurityNotice';

// Hooks
export { useFilePreviewLogic } from './hooks';

// Utils
export * from './utils';
