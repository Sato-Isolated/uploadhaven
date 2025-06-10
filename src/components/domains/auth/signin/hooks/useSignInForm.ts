import { useState, useEffect } from "react";
import { signIn, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAsyncOperation } from "@/hooks";

export interface UseSignInFormReturn {
  // Form state
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  isLoading: boolean;
  
  // Form handlers
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setShowPassword: (show: boolean) => void;
  handleSignIn: (e: React.FormEvent) => Promise<void>;
  togglePasswordVisibility: () => void;
}

export function useSignInForm(): UseSignInFormReturn {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  
  const { loading: isLoading, execute: executeSignIn } = useAsyncOperation({
    onSuccess: () => {
      toast.success("Signed in successfully!");
      // Navigation will be handled by the redirect logic below
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Handle authentication redirect - useEffect is appropriate for side effects like navigation
  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [session?.user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    executeSignIn(async () => {
      const result = await signIn.email({
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error.message || "Sign in failed");
      }
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return {
    // Form state
    email,
    password,
    showPassword,
    error,
    isLoading,
    
    // Form handlers
    setEmail,
    setPassword,
    setShowPassword,
    handleSignIn,
    togglePasswordVisibility,
  };
}
