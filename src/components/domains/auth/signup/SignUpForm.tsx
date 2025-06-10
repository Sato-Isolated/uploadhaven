'use client';

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { useSignUpForm } from './hooks/useSignUpForm';
import { SignUpFormHeader } from './components/SignUpFormHeader';
import { SignUpFormFields } from './components/SignUpFormFields';
import { SignUpFormFooter } from './components/SignUpFormFooter';

export function SignUpForm() {
  const formProps = useSignUpForm();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950 relative overflow-hidden py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_70%)]" />
      <motion.div
        className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 90, 180],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl"
        animate={{
          scale: [1.3, 1, 1.3],
          rotate: [180, 90, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="border-0 shadow-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl relative overflow-hidden">
          {/* Card header gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-indigo-500/5 dark:from-purple-400/10 dark:via-blue-400/10 dark:to-indigo-400/10" />

          <SignUpFormHeader />

          <CardContent className="relative z-10 space-y-6">
            <SignUpFormFields {...formProps} onSubmit={formProps.handleSignUp} />
            <SignUpFormFooter />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
