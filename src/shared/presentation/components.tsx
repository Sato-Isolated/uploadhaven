/**
 * 🧩 Shared UI Components for UploadHaven
 * 
 * Essential UI components adapted from ShadCN/UI for the DDD architecture.
 * Privacy-first design patterns and accessibility compliance.
 */

'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from './utils';

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
  {
    variants: {      variant: {
        default:
          'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-300',
        destructive:
          'bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-300',
        outline:
          'border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-gray-300',
        secondary:
          'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:ring-gray-300',
        ghost:
          'hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-300',
        link: 'text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-300',
        // Privacy-specific variants
        encryption:
          'bg-green-600 text-white shadow-sm hover:bg-green-700 focus-visible:ring-green-300',
        anonymous:
          'bg-purple-600 text-white shadow-sm hover:bg-purple-700 focus-visible:ring-purple-300',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// =============================================================================
// INPUT COMPONENT
// =============================================================================

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-privacy-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// =============================================================================
// PROGRESS COMPONENT
// =============================================================================

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-encryption-500 transition-all duration-300 ease-in-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// =============================================================================
// CARD COMPONENT
// =============================================================================

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-gray-500", className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

// =============================================================================
// BADGE COMPONENT
// =============================================================================

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-gray-50 shadow hover:bg-gray-900/80",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80",
        destructive:
          "border-transparent bg-red-500 text-gray-50 shadow hover:bg-red-500/80",
        outline: "text-gray-950 border-gray-200",
        // Privacy-specific variants
        encryption:
          "border-transparent bg-encryption-500 text-white shadow hover:bg-encryption-600",
        anonymous:
          "border-transparent bg-anonymous-500 text-white shadow hover:bg-anonymous-600",
        privacy:
          "border-transparent bg-privacy-500 text-white shadow hover:bg-privacy-600",
        temporal:
          "border-transparent bg-temporal-500 text-white shadow hover:bg-temporal-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// =============================================================================
// ALERT COMPONENT
// =============================================================================

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-950 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-950 border-gray-200",
        destructive:
          "border-red-500/50 text-red-900 [&>svg]:text-red-500 bg-red-50",
        success:
          "border-green-500/50 text-green-900 [&>svg]:text-green-500 bg-green-50",
        warning:
          "border-amber-500/50 text-amber-900 [&>svg]:text-amber-500 bg-amber-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// =============================================================================
// LABEL COMPONENT
// =============================================================================

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

// =============================================================================
// SELECT COMPONENT
// =============================================================================

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8"
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectValue = () => null;
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
);

// =============================================================================
// CHECKBOX COMPONENT
// =============================================================================

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const Checkbox = ({ id, checked, onCheckedChange }: CheckboxProps) => {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-privacy-500 focus:ring-privacy-500 focus:ring-2"
    />
  );
};

// Export all components
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
  badgeVariants,
  Alert,
  alertVariants,
  AlertDescription,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
};
