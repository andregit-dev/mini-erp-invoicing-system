'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { AxiosError } from 'axios';
import { Mail, Lock, Loader2, Clock } from 'lucide-react';

const formatErrorMessage = (message: string | string[]): string => {
  if (!message) return 'An unexpected error occurred';
  if (Array.isArray(message)) {
    return message
      .map((err) => {
        const formatted = err
          .replace(/should not be empty/g, 'is required')
          .replace(/must be an email/g, 'is invalid')
          .replace(/must be a string/g, 'is invalid');
        return `• ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
      })
      .join('\n');
  }

  const errors = message.split(',').map((err) => err.trim());
  
  if (errors.length > 1) {
    return errors
      .map((err) => {
        const formatted = err
          .replace(/should not be empty/g, 'is required')
          .replace(/must be an email/g, 'is invalid')
          .replace(/must be a string/g, 'is invalid');
        return `• ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
      })
      .join('\n');
  }

  // SINGLE ERROR
  const formatted = errors[0]
    .replace(/should not be empty/g, 'is required')
    .replace(/must be an email/g, 'is invalid')
    .replace(/must be a string/g, 'is invalid');
  
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rateLimit, setRateLimit] = useState<{ retryAfter: number } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0 && rateLimit) {
      setRateLimit(null);
      setError('');
    }
  }, [countdown, rateLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const rawMessage = err.response?.data?.message || 'Login failed';
        const message = formatErrorMessage(rawMessage);
        
        if (status === 429) {
          const retryAfter = err.response?.headers?.['retry-after'] 
            ? parseInt(err.response.headers['retry-after']) 
            : 60;
          setRateLimit({ retryAfter });
          setCountdown(retryAfter);
          setError(`Too many login attempts. Please wait ${retryAfter} seconds.`);
        } else {
          setError(message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mini ERP</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to manage your invoices</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off" noValidate>
          {error && (
            <div className={`p-3 rounded-xl text-sm border animate-in fade-in duration-200 ${
              rateLimit 
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              <div className="flex items-center gap-2 whitespace-pre-wrap">
                {rateLimit && <Clock className="w-4 h-4" />}
                {error}
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                disabled={!!rateLimit}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={!!rateLimit}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!rateLimit}
            className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : rateLimit ? (
              <>
                <Clock className="w-4 h-4" />
                Wait {countdown}s
              </>
            ) : (
              'Sign in'
            )}
          </button>

          <p className="text-center text-sm text-gray-600 pt-2">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
