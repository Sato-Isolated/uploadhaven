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
        <div className="absolute inset-1 w-6 h-6 bg-primary/20 tactical-border animate-ping"></div>
      </div>
      <span className="text-primary font-tactical typing-animation">{text}...</span>
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
          <span className="tabular-nums">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-secondary border border-border tactical-border h-2 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-300 ease-out ${getVariantClasses()} relative progress-scan`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
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
        <span className="text-success animate-pulse">{">"}</span>
        <span className="typing-animation">{text}</span>
        <span className="animate-blink text-primary">_</span>
      </div>
    </div>
  );
}

// New advanced loading components
interface LaserScanLoadingProps {
  text?: string;
  className?: string;
}

export function LaserScanLoading({ text = "Scanning", className = "" }: LaserScanLoadingProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative w-16 h-16 border border-primary/30 tactical-border">
        <div className="absolute inset-0 border border-primary tactical-border animate-ping"></div>
        <div className="absolute inset-2 border border-success tactical-border animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute inset-4 bg-primary/20 tactical-border animate-pulse" style={{ animationDelay: '1s' }}></div>
        {/* Scanning line */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-bounce"></div>
      </div>
      <span className="text-primary font-tactical text-sm animate-pulse">{text}...</span>
    </div>
  );
}

interface CryptoLoadingProps {
  stage?: "encrypting" | "uploading" | "processing" | "downloading" | "decrypting";
  className?: string;
}

export function CryptoLoading({ stage = "encrypting", className = "" }: CryptoLoadingProps) {
  const getStageText = () => {
    switch (stage) {
      case "encrypting":
        return "ENCRYPTING DATA";
      case "uploading":
        return "UPLOADING FILE";
      case "downloading":
        return "DOWNLOADING FILE";
      case "decrypting":
        return "DECRYPTING DATA";
      case "processing":
        return "PROCESSING";
      default:
        return "PROCESSING";
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case "encrypting":
        return "🔒";
      case "uploading":
        return "⬆️";
      case "downloading":
        return "⬇️";
      case "decrypting":
        return "🔓";
      case "processing":
        return "⚙️";
      default:
        return "⚙️";
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 border-2 border-primary/30 tactical-border animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-lg animate-pulse">
          {getStageIcon()}
        </div>
      </div>
      <div className="text-center">
        <div className="text-primary font-tactical text-sm typing-animation">
          {getStageText()}
        </div>
        <div className="flex justify-center mt-2">
          <LoadingDots />
        </div>
      </div>
    </div>
  );
}

interface PulseLoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PulseLoading({ size = "md", className = "" }: PulseLoadingProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-6 h-6";
      case "lg":
        return "w-8 h-8";
      default:
        return "w-6 h-6";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${getSizeClasses()} bg-primary/20 tactical-border animate-ping`}></div>
      <div className={`absolute inset-0 ${getSizeClasses()} bg-primary/40 tactical-border animate-pulse`}></div>
      <div className={`absolute inset-1 bg-primary tactical-border`}></div>
    </div>
  );
}
