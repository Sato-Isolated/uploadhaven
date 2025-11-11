"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current?.offsetHeight || 40;
    const tooltipWidth = tooltipRef.current?.offsetWidth || 100;
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case "top":
        top = triggerRect.top - tooltipHeight - 8;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + 8;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.left - tooltipWidth - 8;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.right + 8;
        break;
    }
    
    setCoords({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    // Pas besoin de classes de positionnement, on utilise top/left en pixels
    return "";
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-popover";
      case "bottom":
        return "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-popover";
      case "left":
        return "right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-popover";
      case "right":
        return "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-popover";
      default:
        return "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-popover";
    }
  };

  const tooltipContent = isVisible && mounted && (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] px-3 py-2 text-xs text-popover-foreground bg-popover border border-border tactical-border shadow-lg max-w-xs pointer-events-none"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        animation: "fadeInUp 0.2s ease-out"
      }}
    >
      {content}
      <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
    </div>
  );

  return (
    <>
      <div 
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {mounted && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
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
