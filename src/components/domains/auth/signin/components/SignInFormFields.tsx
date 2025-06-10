import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

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
          className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-800/50 backdrop-blur-sm"
        >
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
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
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
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
            className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800/50 dark:text-white backdrop-blur-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
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
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <label
          htmlFor="password"
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
        >
          <Lock className="h-4 w-4 text-blue-500" />
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pl-11 pr-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800/50 dark:text-white backdrop-blur-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
            placeholder="Enter your password"
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
      </motion.div>
    </div>
  );
}
