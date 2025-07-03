"use client";

import { ReactNode, useState } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  position = "top", 
  delay = 300,
  className = "" 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-border";
      case "bottom":
        return "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-border";
      case "left":
        return "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-border";
      case "right":
        return "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-border";
      default:
        return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-border";
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs text-popover-foreground bg-popover border border-border tactical-border shadow-lg whitespace-nowrap transition-all duration-200 ${getPositionClasses()}`}
          style={{
            animation: "fadeInUp 0.2s ease-out"
          }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 border-4 ${getArrowClasses()}`}
          />
        </div>
      )}
    </div>
  );
}

interface InfoTooltipProps {
  content: ReactNode;
  className?: string;
}

export function InfoTooltip({ content, className = "" }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position="top" className={className}>
      <div className="inline-flex items-center justify-center w-4 h-4 bg-muted border border-border tactical-border text-xs text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-help">
        ?
      </div>
    </Tooltip>
  );
}

interface HelpTooltipProps {
  title: string;
  description: ReactNode;
  className?: string;
}

export function HelpTooltip({ title, description, className = "" }: HelpTooltipProps) {
  return (
    <Tooltip 
      content={
        <div className="max-w-xs">
          <div className="font-medium text-foreground mb-1">{title}</div>
          <div className="text-muted-foreground">{description}</div>
        </div>
      } 
      position="top" 
      className={className}
      delay={200}
    >
      <div className="inline-flex items-center justify-center w-4 h-4 bg-primary/10 border border-primary/30 tactical-border text-xs text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-help">
        i
      </div>
    </Tooltip>
  );
}
