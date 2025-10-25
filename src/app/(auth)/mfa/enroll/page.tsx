'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema for TOTP code
const verifyCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

interface EnrollResponse {
  data?: {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}

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

export default function MFAEnrollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
  });

  // Load MFA setup on mount
  useEffect(() => {
    const initializeMFA = async () => {
      setLoading(true);
      setServerError(null);

      try {
        const response = await fetch('/api/auth/mfa/enroll', {
          method: 'POST',
          credentials: 'include', // Include cookies
        });

        const result: EnrollResponse = await response.json();

        if (!response.ok) {
          if (result.error) {
            setServerError(result.error.message);
          } else {
            setServerError('Failed to initialize MFA setup. Please try again.');
          }
          return;
        }

        // Success - save setup data
        if (result.data) {
          setSecret(result.data.secret);
          setQrCodeUrl(result.data.qrCodeUrl);
          setBackupCodes(result.data.backupCodes);
          setStep('verify');
        }
      } catch (error) {
        console.error('MFA enrollment error:', error);
        setServerError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeMFA();
  }, []);

  const onSubmitCode = async (data: VerifyCodeFormData) => {
    setVerifying(true);
    setServerError(null);

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: data.code,
          type: 'setup',
        }),
        credentials: 'include', // Include cookies
      });

      const result: VerifyResponse = await response.json();

      if (!response.ok) {
        if (result.error) {
          setServerError(result.error.message);
        } else {
          setServerError('Verification failed. Please try again.');
        }
        return;
      }

      // Success - move to complete step
      setStep('complete');
    } catch (error) {
      console.error('MFA verification error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backupCodes') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-primary mx-auto"
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
          <p className="mt-4 text-sm text-gray-600">Initializing MFA setup...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (serverError && step === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Setup Failed
            </h1>
            <p className="mt-4 text-base text-red-600">{serverError}</p>
          </div>
          <Link
            href="/dashboard/settings"
            className="w-full flex justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors min-h-[44px]"
          >
            Back to Settings
          </Link>
        </div>
      </div>
    );
  }

  // Complete state
  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              MFA Enabled Successfully!
            </h1>
            <p className="mt-4 text-base text-gray-600">
              Two-factor authentication is now active on your account.
            </p>
          </div>

          {/* Backup Codes Display */}
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Save Your Backup Codes
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
                </div>
                <div className="mt-4 bg-white rounded-md p-3 border border-yellow-300">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="text-gray-900">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => copyToClipboard(backupCodes.join('\n'), 'backupCodes')}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded"
                  >
                    {copiedBackupCodes ? '✓ Copied!' : 'Copy All Codes'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors min-h-[44px]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Verify step
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Enable Two-Factor Authentication
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - QR Code */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                1. Scan QR Code
              </h2>
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="MFA QR Code"
                  className="w-full max-w-xs mx-auto"
                />
              )}
              <p className="mt-4 text-sm text-gray-600 text-center">
                Can't scan? Use the code below:
              </p>
              <div className="mt-2 bg-gray-50 rounded-md p-3 border border-gray-200">
                <code className="text-sm font-mono text-gray-900 break-all">
                  {secret}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(secret, 'secret')}
                className="mt-2 w-full text-sm font-medium text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                {copiedSecret ? '✓ Copied!' : 'Copy Secret'}
              </button>
            </div>
          </div>

          {/* Right Column - Verify Form */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                2. Enter Verification Code
              </h2>

              <form onSubmit={handleSubmit(onSubmitCode)} className="space-y-4">
                {/* Server Error */}
                {serverError && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3" role="alert">
                    <p className="text-sm text-red-800">{serverError}</p>
                  </div>
                )}

                {/* Code Input */}
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    6-digit code from your app
                  </label>
                  <input
                    {...register('code')}
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    className={`block w-full rounded-md border ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 text-center text-2xl font-mono tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                    placeholder="000000"
                    aria-invalid={errors.code ? 'true' : 'false'}
                    aria-describedby={errors.code ? 'code-error' : undefined}
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600" id="code-error" role="alert">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full flex justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  {verifying ? 'Verifying...' : 'Verify and Enable MFA'}
                </button>
              </form>
            </div>

            {/* Backup Codes Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
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
                    After verification, you'll receive backup codes. Save them in a secure location to regain access if you lose your authenticator device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Link */}
        <div className="text-center">
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            Cancel and go back
          </Link>
        </div>
      </div>
    </div>
  );
}
