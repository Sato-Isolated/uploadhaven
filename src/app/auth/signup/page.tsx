import { SignUpForm } from '@/domains/user-management/presentation/components/SignUpForm';
import { Header } from '@/shared/presentation/components/Header';
import { Footer } from '@/shared/presentation/components/Footer';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Your Account
            </h1>
            <p className="mt-2 text-gray-600">
              Optional account for managing your encrypted files
            </p>
          </div>

          {/* Privacy Guarantees */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🔐</span>
                <span className="font-medium text-blue-800">Same Zero-Knowledge Protection</span>
              </div>
              <ul className="text-blue-700 space-y-1 ml-6">
                <li>• Files remain encrypted - we can't see them</li>
                <li>• Account adds file management features</li>
                <li>• Still anonymous uploads available</li>
                <li>• Data encrypted with your password</li>
              </ul>
            </div>
          </div>

          {/* Sign Up Form */}
          <SignUpForm />

          {/* Footer Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </a>
            </p>
            <p className="text-xs text-gray-500">
              Or continue{' '}
              <a href="/" className="text-blue-600 hover:text-blue-700">
                sharing anonymously
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
