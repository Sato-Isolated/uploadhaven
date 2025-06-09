import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const useToast = () => {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    const message = description ? `${title}: ${description}` : title;

    if (variant === "destructive") {
      sonnerToast.error(message);
    } else {
      sonnerToast.success(message);
    }
  };

  return { toast };
};
