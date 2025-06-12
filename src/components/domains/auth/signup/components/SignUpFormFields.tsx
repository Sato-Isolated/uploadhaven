'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  Loader2,
  Check,
} from 'lucide-react';
import { PasswordRequirements } from './PasswordRequirements';
import type { PasswordValidation } from '../hooks/useSignUpForm';

interface SignUpFormFieldsProps {
  // Form state
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  error: string;
  isLoading: boolean;

  // Validation state
  passwordValidations: PasswordValidation[];
  isPasswordValid: boolean;
  doPasswordsMatch: boolean;

  // Actions
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setName: (name: string) => void;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SignUpFormFields({
  email,
  password,
  confirmPassword,
  name,
  showPassword,
  showConfirmPassword,
  error,
  isLoading,
  passwordValidations,
  isPasswordValid,
  doPasswordsMatch,
  setEmail,
  setPassword,
  setConfirmPassword,
  setName,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  onSubmit,
}: SignUpFormFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-red-200 bg-red-50 p-4 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-950/50"
        >
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {error}
          </p>
        </motion.div>
      )}

      {/* Name Field */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <label
          htmlFor="name"
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          <User className="h-4 w-4 text-purple-500" />
          Full Name
        </label>
        <div className="relative">
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:hover:border-gray-600"
            placeholder="Enter your full name"
            required
            disabled={isLoading}
          />
          <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        </div>
      </motion.div>

      {/* Email Field */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <label
          htmlFor="email"
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          <Mail className="h-4 w-4 text-purple-500" />
          Email Address
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:hover:border-gray-600"
            placeholder="Enter your email address"
            required
            disabled={isLoading}
          />
          <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        </div>
      </motion.div>

      {/* Password Field */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-2"
      >
        <label
          htmlFor="password"
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          <Lock className="h-4 w-4 text-purple-500" />
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 pl-11 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:hover:border-gray-600"
            placeholder="Create a secure password"
            required
            disabled={isLoading}
          />
          <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        <PasswordRequirements
          password={password}
          passwordValidations={passwordValidations}
        />
      </motion.div>

      {/* Confirm Password Field */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-2"
      >
        <label
          htmlFor="confirmPassword"
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          <Lock className="h-4 w-4 text-purple-500" />
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 pr-11 pl-11 backdrop-blur-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none dark:bg-gray-800/50 dark:text-white ${
              confirmPassword && doPasswordsMatch
                ? 'border-green-300 dark:border-green-600'
                : confirmPassword && !doPasswordsMatch
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
            placeholder="Confirm your password"
            required
            disabled={isLoading}
          />
          <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {confirmPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-1 text-xs ${
              doPasswordsMatch
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            <Check className="h-3 w-3" />
            {doPasswordsMatch ? 'Passwords match' : "Passwords don't match"}
          </motion.div>
        )}
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          type="submit"
          className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-purple-600 hover:to-blue-700 hover:shadow-xl"
          disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.6 }}
          />
          <span className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UserPlus className="h-5 w-5" />
            )}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </span>
        </Button>
      </motion.div>
    </form>
  );
}
