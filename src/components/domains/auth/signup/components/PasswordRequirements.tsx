'use client';

import { motion } from 'motion/react';
import { Shield, Check } from 'lucide-react';
import type { PasswordValidation } from '../hooks/useSignUpForm';

interface PasswordRequirementsProps {
  password: string;
  passwordValidations: PasswordValidation[];
}

export function PasswordRequirements({
  password,
  passwordValidations,
}: PasswordRequirementsProps) {
  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 space-y-2"
    >
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <Shield className="h-3 w-3" />
        Password requirements:
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {passwordValidations.map((validation, index) => (
          <motion.div
            key={validation.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-1 ${
              validation.valid
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <Check
              className={`h-3 w-3 ${
                validation.valid ? 'opacity-100' : 'opacity-30'
              }`}
            />
            {validation.label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
