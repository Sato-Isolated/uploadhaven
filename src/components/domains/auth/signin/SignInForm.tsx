"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { useSignInForm } from "./hooks/useSignInForm";
import { SignInFormBackground } from "./components/SignInFormBackground";
import { SignInFormHeader } from "./components/SignInFormHeader";
import { SignInFormFields } from "./components/SignInFormFields";
import { SignInFormActions } from "./components/SignInFormActions";
import { SignInFormFooter } from "./components/SignInFormFooter";

export default function SignInForm() {
  const {
    email,
    password,
    showPassword,
    error,
    isLoading,
    setEmail,
    setPassword,
    handleSignIn,
    togglePasswordVisibility,
  } = useSignInForm();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 relative overflow-hidden">
      <SignInFormBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="border-0 shadow-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl relative overflow-hidden">
          {/* Card header gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-400/10 dark:via-indigo-400/10 dark:to-purple-400/10" />

          <SignInFormHeader />

          <CardContent className="relative z-10 space-y-6">
            <form onSubmit={handleSignIn} className="space-y-5">
              <SignInFormFields
                email={email}
                password={password}
                showPassword={showPassword}
                isLoading={isLoading}
                error={error}
                setEmail={setEmail}
                setPassword={setPassword}
                togglePasswordVisibility={togglePasswordVisibility}
              />

              <SignInFormActions isLoading={isLoading} />
            </form>

            <SignInFormFooter />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
