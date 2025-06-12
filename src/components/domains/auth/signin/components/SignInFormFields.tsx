import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface SignInFormFieldsProps {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  togglePasswordVisibility: () => void;
}

export function SignInFormFields({
  email,
  password,
  showPassword,
  isLoading,
  error,
  setEmail,
  setPassword,
  togglePasswordVisibility,
}: SignInFormFieldsProps) {
  return (
    <div className="space-y-5">
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

      {/* Email Field */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <label
          htmlFor="email"
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          <Mail className="h-4 w-4 text-blue-500" />
          Email Address
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:hover:border-gray-600"
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
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <label
          htmlFor="password"
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          <Lock className="h-4 w-4 text-blue-500" />
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 pl-11 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:hover:border-gray-600"
            placeholder="Enter your password"
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
      </motion.div>
    </div>
  );
}
