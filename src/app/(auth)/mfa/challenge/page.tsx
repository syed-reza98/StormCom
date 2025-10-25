'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema for MFA code (TOTP or backup code)
const mfaChallengeSchema = z.object({
  code: z.string().regex(
    /^\d{6}$|^[A-Za-z0-9]{10}$/,
    'Enter either a 6-digit code or a 10-character backup code'
  ),
});

type MFAChallengeFormData = z.infer<typeof mfaChallengeSchema>;

interface VerifyResponse {
  data?: {
    message: string;
    mfaVerified: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export default function MFAChallengePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MFAChallengeFormData>({
    resolver: zodResolver(mfaChallengeSchema),
  });

  const onSubmit = async (data: MFAChallengeFormData) => {
    setLoading(true);
    setServerError(null);

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: data.code,
          type: 'login',
        }),
        credentials: 'include', // Include cookies
      });

      const result: VerifyResponse = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (result.error) {
          setServerError(result.error.message);
        } else {
          setServerError('Verification failed. Please try again.');
        }
        return;
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('MFA verification error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setServerError(null);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Two-Factor Authentication
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {useBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {/* MFA Challenge Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Server Error Message */}
          {serverError && (
            <div
              className="rounded-md bg-red-50 border border-red-200 p-4"
              role="alert"
              aria-live="polite"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{serverError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Code Input */}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {useBackupCode ? 'Backup code' : 'Verification code'}
              </label>
              <input
                {...register('code')}
                id="code"
                type="text"
                inputMode={useBackupCode ? 'text' : 'numeric'}
                pattern={useBackupCode ? '[A-Za-z0-9]*' : '[0-9]*'}
                maxLength={useBackupCode ? 10 : 6}
                autoComplete="one-time-code"
                autoFocus
                className={`block w-full rounded-md border ${
                  errors.code ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 text-center ${
                  useBackupCode ? 'text-lg' : 'text-2xl'
                } font-mono tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                placeholder={useBackupCode ? 'ABCD123456' : '000000'}
                aria-invalid={errors.code ? 'true' : 'false'}
                aria-describedby={errors.code ? 'code-error' : undefined}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600" id="code-error" role="alert">
                  {errors.code.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            aria-label={loading ? 'Verifying...' : 'Verify and continue'}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verifying...
              </>
            ) : (
              'Verify and Continue'
            )}
          </button>
        </form>

        {/* Toggle Backup Code */}
        <div className="text-center">
          <button
            onClick={toggleBackupCode}
            className="text-sm font-medium text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            {useBackupCode
              ? '← Use authenticator app instead'
              : 'Lost your device? Use a backup code'}
          </button>
        </div>

        {/* Info Box */}
        <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {useBackupCode
                  ? 'Each backup code can only be used once. After using it, generate new backup codes from your account settings.'
                  : 'The code refreshes every 30 seconds in your authenticator app. Make sure to enter the current code.'}
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded inline-flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
