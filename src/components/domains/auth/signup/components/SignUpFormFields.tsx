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
          className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-800/50 backdrop-blur-sm"
        >
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
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
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
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
            className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800/50 dark:text-white backdrop-blur-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
            placeholder="Enter your full name"
            required
            disabled={isLoading}
          />
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
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
            className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800/50 dark:text-white backdrop-blur-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
            placeholder="Enter your email address"
            required
            disabled={isLoading}
          />
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
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
            className="w-full px-4 py-3 pl-11 pr-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800/50 dark:text-white backdrop-blur-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
            placeholder="Create a secure password"
            required
            disabled={isLoading}
          />
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
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
            className={`w-full px-4 py-3 pl-11 pr-11 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800/50 dark:text-white backdrop-blur-sm transition-all duration-300 ${
              confirmPassword && doPasswordsMatch
                ? 'border-green-300 dark:border-green-600'
                : confirmPassword && !doPasswordsMatch
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            placeholder="Confirm your password"
            required
            disabled={isLoading}
          />
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            className={`text-xs flex items-center gap-1 ${
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
          className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
          disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
