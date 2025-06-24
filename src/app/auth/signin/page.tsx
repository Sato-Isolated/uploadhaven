import { SignInForm } from '@/domains/user-management/presentation/components/SignInForm';
import { Header } from '@/shared/presentation/components/Header';
import { Footer } from '@/shared/presentation/components/Footer';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-gray-600">
              Sign in to your encrypted account
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600">🔒</span>
              <span className="text-sm font-medium text-green-800">Privacy Protected</span>
            </div>
            <p className="text-xs text-green-700">
              Your data is encrypted. Even with an account, your files remain zero-knowledge.
            </p>
          </div>

          {/* Sign In Form */}
          <SignInForm />          {/* Footer Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Create one
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Or continue{' '}
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                sharing anonymously
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
