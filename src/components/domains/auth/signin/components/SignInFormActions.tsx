import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';

interface SignInFormActionsProps {
  isLoading: boolean;
}

export function SignInFormActions({ isLoading }: SignInFormActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Button
        type="submit"
        className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl"
        disabled={isLoading}
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
            <LogIn className="h-5 w-5" />
          )}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </span>
      </Button>
    </motion.div>
  );
}
