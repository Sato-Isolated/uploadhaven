/**
 * 🔐 User Registration Component - Privacy-First Account Creation
 * 
 * React component for user registration with zero-knowledge guarantees.
 * Features encrypted data storage and privacy-aware form handling.
 * 
 * @domain user-management
 * @pattern React Component
 * @privacy zero-knowledge - client-side encryption, privacy-first UI
 */

'use client';

import React, { useState } from 'react';
import { useUserRegistration } from '../hooks/useUserAccount';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface UserRegistrationProps {
  userRepository: IUserRepository;
  onSuccess?: (result: { userId: string; emailHash: string }) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function UserRegistration({
  userRepository,
  onSuccess,
  onError,
  className = ''
}: UserRegistrationProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    language: 'en' as 'en' | 'fr' | 'es',
    agreedToTerms: false,
    agreedToPrivacy: false
  });

  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');

  const registrationMutation = useUserRegistration(userRepository);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await registrationMutation.mutateAsync({
        ...formData,
        encryptionKey: encryptionKey || undefined // Use custom key or let system generate
      });

      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      onError?.(errorMessage);
    }
  };

  const generateEncryptionKey = () => {
    // Generate a strong encryption key for the user
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setEncryptionKey(key);
  };

  return (
    <div className={`max-w-md mx-auto bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔒 Create Account
        </h2>
        <p className="text-sm text-gray-600">
          Your personal data will be encrypted before storage. The server cannot decrypt your information.
        </p>
      </div>

      {/* Privacy Guarantee Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-blue-600">🛡️</span>
          <h3 className="font-medium text-blue-900">Zero-Knowledge Privacy</h3>
        </div>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your email and name are encrypted in your browser</li>
          <li>• Server cannot decrypt your personal data</li>
          <li>• You control your encryption key</li>
          <li>• No tracking or surveillance</li>
        </ul>
        <button
          type="button"
          onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
          className="text-xs text-blue-600 hover:text-blue-800 mt-2"
        >
          {showPrivacyInfo ? 'Hide' : 'Show'} technical details
        </button>

        {showPrivacyInfo && (
          <div className="mt-3 p-3 bg-blue-100 rounded text-xs text-blue-900">
            <p><strong>Encryption:</strong> AES-256-GCM with random IV</p>
            <p><strong>Key Storage:</strong> Client-side only, never sent to server</p>
            <p><strong>Lookup:</strong> SHA-256 email hash for privacy-preserving authentication</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name (Optional)
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
            maxLength={100}
          />
        </div>

        {/* Language Selection */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Language
          </label>
          <select
            id="language"
            value={formData.language}
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as 'en' | 'fr' | 'es' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>

        {/* Encryption Key Section */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔑 Encryption Key (Advanced)
          </label>
          <p className="text-xs text-gray-600 mb-2">
            Leave empty for automatic generation, or provide your own 64-character hex key.
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
              placeholder="Auto-generated if empty"
              maxLength={64}
            />
            <button
              type="button"
              onClick={generateEncryptionKey}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Terms and Privacy Agreement */}
        <div className="space-y-3">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.agreedToTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              required
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                Terms of Service
              </a>
            </span>
          </label>

          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.agreedToPrivacy}
              onChange={(e) => setFormData(prev => ({ ...prev, agreedToPrivacy: e.target.checked }))}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              required
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        {/* Error Display */}
        {registrationMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              {registrationMutation.error instanceof Error
                ? registrationMutation.error.message
                : 'Registration failed'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={registrationMutation.isPending || !formData.agreedToTerms || !formData.agreedToPrivacy}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200"
        >
          {registrationMutation.isPending ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Creating Account...</span>
            </span>
          ) : (
            '🔒 Create Encrypted Account'
          )}
        </button>
      </form>

      {/* Success Message */}
      {registrationMutation.isSuccess && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <h3 className="font-medium text-green-900">Account Created Successfully!</h3>
          </div>
          <p className="text-sm text-green-800 mt-1">
            Please check your email to verify your account. Your data is encrypted and secure.
          </p>
        </div>
      )}
    </div>
  );
}
