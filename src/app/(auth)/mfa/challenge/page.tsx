'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FormError } from '@/components/auth/form-error';
import { Shield, Info, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {useBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Server Error */}
            <FormError message={serverError || undefined} />

            {/* Code Input */}
            <div className="space-y-2">
              <Label htmlFor="code">
                {useBackupCode ? 'Backup code' : 'Verification code'}
              </Label>
              <Input
                {...register('code')}
                id="code"
                type="text"
                inputMode={useBackupCode ? 'text' : 'numeric'}
                pattern={useBackupCode ? '[A-Za-z0-9]*' : '[0-9]*'}
                maxLength={useBackupCode ? 10 : 6}
                autoComplete="one-time-code"
                autoFocus
                className={`text-center font-mono tracking-widest ${
                  useBackupCode ? 'text-lg' : 'text-2xl'
                }`}
                placeholder={useBackupCode ? 'ABCD123456' : '000000'}
                error={!!errors.code}
                aria-invalid={errors.code ? 'true' : 'false'}
                aria-describedby={errors.code ? 'code-error' : undefined}
              />
              {errors.code && (
                <p className="text-sm text-destructive" id="code-error" role="alert">
                  {errors.code.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify and Continue'}
            </Button>
          </form>

          {/* Toggle Backup Code */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBackupCode}
              className="text-primary"
            >
              {useBackupCode
                ? '← Use authenticator app instead'
                : 'Lost your device? Use a backup code'}
            </Button>
          </div>

          {/* Info Box */}
          <div className="rounded-md bg-primary/10 border border-primary p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {useBackupCode
                  ? 'Each backup code can only be used once. After using it, generate new backup codes from your account settings.'
                  : 'The code refreshes every 30 seconds in your authenticator app. Make sure to enter the current code.'}
              </p>
            </div>
          </div>

          {/* Back to Login Link */}
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
