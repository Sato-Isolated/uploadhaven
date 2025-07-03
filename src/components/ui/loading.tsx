"use client";

import { ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4";
      case "md":
        return "h-6 w-6";
      case "lg":
        return "h-8 w-8";
      default:
        return "h-6 w-6";
    }
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-border border-t-primary ${getSizeClasses()} ${className}`}
    />
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className = "" }: LoadingDotsProps) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  );
}

interface TacticalLoadingProps {
  text?: string;
  className?: string;
}

export function TacticalLoading({ text = "Loading", className = "" }: TacticalLoadingProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 border-2 border-border tactical-border"></div>
        <div className="absolute inset-0 w-8 h-8 border-2 border-primary tactical-border animate-pulse"></div>
      </div>
      <span className="text-primary font-tactical animate-pulse">{text}...</span>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
}

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "h-4 rounded";
      case "circular":
        return "rounded-full";
      case "rectangular":
        return "rounded tactical-border";
      default:
        return "rounded tactical-border";
    }
  };

  return (
    <div
      className={`bg-muted animate-pulse ${getVariantClasses()} ${className}`}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div className={`tactical-card p-6 space-y-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-5/6" />
        <Skeleton variant="text" className="w-4/5" />
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
}

export function ProgressBar({
  progress,
  className = "",
  showPercentage = true,
  variant = "default",
}: ProgressBarProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "danger":
        return "bg-destructive";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-muted-foreground font-tactical">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-secondary border border-border tactical-border h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${getVariantClasses()}`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  text?: string;
}

export function LoadingOverlay({ isLoading, children, text = "Loading" }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <TacticalLoading text={text} />
        </div>
      )}
    </div>
  );
}

interface TerminalLoadingProps {
  text?: string;
  className?: string;
}

export function TerminalLoading({ text = "Initializing", className = "" }: TerminalLoadingProps) {
  return (
    <div className={`font-tactical text-primary ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-success">{">"}</span>
        <span className="animate-pulse">{text}</span>
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );
}
