"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import { showToast } from '@/utils/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    if (!email) {
      showToast.error('Please enter your email address.');
      return;
    }

    fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          showToast.error(data.error);
          setError(data.error);
          return;
        }
        if (data.message) {
          showToast.success(data.message);
          setSuccess(true);
        }
      })
      .catch((err) => {
        console.error(err);
        showToast.error('Failed to send password reset email.');
        setError(err.message || 'Failed to send password reset email. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
            <CurrencyDollarIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mb-4 bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">Password reset email sent! Check your inbox for further instructions.</span>
              </div>
              <Link
                href="/auth/signin"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 