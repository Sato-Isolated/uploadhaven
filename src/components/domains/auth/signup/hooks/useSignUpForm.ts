'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signUp } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAsyncOperation } from '@/hooks';

export interface PasswordValidation {
  label: string;
  valid: boolean;
}

export function useSignUpForm() {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const { loading: isLoading, execute: executeSignUp } = useAsyncOperation({
    onSuccess: () => {
      toast.success(t('accountCreatedSuccessfully'));
      router.push('/dashboard');
    },
    onError: () => {
      const errorMessage = t('failedToCreateAccount');
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Password validation helpers
  const passwordValidations: PasswordValidation[] = [
    { label: t('atLeast8Characters'), valid: password.length >= 8 },
    { label: t('containsUppercaseLetter'), valid: /[A-Z]/.test(password) },
    { label: t('containsLowercaseLetter'), valid: /[a-z]/.test(password) },
    { label: t('containsNumber'), valid: /\d/.test(password) },
  ];

  const isPasswordValid = passwordValidations.every((v) => v.valid);
  const doPasswordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (password !== confirmPassword) {
      const errorMsg = t('passwordsDoNotMatch');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!isPasswordValid) {
      const errorMsg = t('pleaseMeetPasswordRequirements');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    executeSignUp(async () => {
      await signUp.email({
        email,
        password,
        name,
      });
    });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  return {
    // Form state
    email,
    password,
    confirmPassword,
    name,
    showPassword,
    showConfirmPassword,
    error,
    isLoading,

    // Validation state
    passwordValidations,
    isPasswordValid,
    doPasswordsMatch,

    // Actions
    setEmail,
    setPassword,
    setConfirmPassword,
    setName,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    handleSignUp,
  };
}
