import { ReactNode } from 'react';

// Feature Item Interface
export interface FeatureItem {
  icon: ReactNode;
  title: string;
  description: string;
  iconBgColor: string;
  delay: number;
}

// Upload Limit Item Interface
export interface UploadLimitItem {
  label: string;
  value: ReactNode;
  delay: number;
}

// API Endpoint Interface
export interface ApiEndpoint {
  title: string;
  endpoint: string;
  description: string;
  delay: number;
}

// FAQ Item Interface
export interface FaqItem {
  question: string;
  answer: string;
  delay: number;
}

// Component Props Interfaces
export interface FeaturesProps {
  features: FeatureItem[];
}

export interface UploadLimitsProps {
  limits: UploadLimitItem[];
  supportedTypes: {
    name: string;
    extensions: string;
  }[];
}

export interface ApiInfoProps {
  endpoints: ApiEndpoint[];
  exampleCommand: string;
}

export interface FaqProps {
  faqs: FaqItem[];
}

// Supported File Format Interface
export interface SupportedFormat {
  name: string;
  color: string;
}

// Expiration Option Interface
export interface ExpirationOption {
  label: string;
  color: string;
}
