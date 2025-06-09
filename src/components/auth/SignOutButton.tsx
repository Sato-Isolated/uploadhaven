"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";
import { LogOut, Loader2 } from "lucide-react";
import { useAsyncOperation } from "@/hooks";

export default function SignOutButton() {
  const router = useRouter();

  const { loading: isLoading, execute } = useAsyncOperation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to sign out");
    },
  });

  const handleSignOut = () => {
    execute(async () => {
      await signOut();
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Button
        variant="outline"
        onClick={handleSignOut}
        disabled={isLoading}
        className="group relative overflow-hidden border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-300 transition-all duration-300"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ x: "-100%" }}
          whileHover={{ x: "0%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <span className="relative flex items-center gap-2 font-medium">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
          {isLoading ? "Signing out..." : "Sign Out"}
        </span>
      </Button>
    </motion.div>
  );
}
