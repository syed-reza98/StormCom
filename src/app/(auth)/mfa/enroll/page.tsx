'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
import { CheckCircle, AlertTriangle, Info, Copy } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true" />
            <p className="mt-4 text-sm text-muted-foreground">Initializing MFA setup...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (serverError && step === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Setup Failed</CardTitle>
            <CardDescription className="text-destructive">{serverError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings" className="w-full">
              <Button className="w-full">Back to Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete state
  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-success" aria-hidden="true" />
            <CardTitle>MFA Enabled Successfully!</CardTitle>
            <CardDescription>
              Two-factor authentication is now active on your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Backup Codes Warning */}
            <div className="rounded-md bg-warning/10 border border-warning p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-medium text-foreground">
                    Save Your Backup Codes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                  </p>
                  
                  {/* Backup Codes Grid */}
                  <div className="bg-background rounded-md p-3 border">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="text-foreground">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(backupCodes.join('\n'), 'backupCodes')}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                    {copiedBackupCodes ? '✓ Copied!' : 'Copy All Codes'}
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verify step
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Enable Two-Factor Authentication
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrCodeUrl && (
                <div className="bg-muted rounded-lg p-6 flex items-center justify-center">
                  <Image
                    src={qrCodeUrl}
                    alt="MFA QR Code"
                    width={300}
                    height={300}
                    className="w-full max-w-xs mx-auto"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Can{'\''}t scan? Use the code below:
                </p>
                <div className="bg-muted rounded-md p-3 border">
                  <code className="text-sm font-mono text-foreground break-all block text-center">
                    {secret}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(secret, 'secret')}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                  {copiedSecret ? '✓ Copied!' : 'Copy Secret'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Verify Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Enter Verification Code</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmitCode)} className="space-y-4">
                  {/* Server Error */}
                  <FormError message={serverError || undefined} />

                  {/* Code Input */}
                  <div className="space-y-2">
                    <Label htmlFor="code">6-digit code from your app</Label>
                    <Input
                      {...register('code')}
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                      className="text-center text-2xl font-mono tracking-widest"
                      placeholder="000000"
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
                    disabled={verifying}
                    loading={verifying}
                    className="w-full"
                  >
                    {verifying ? 'Verifying...' : 'Verify and Enable MFA'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Backup Codes Info */}
            <div className="rounded-md bg-primary/10 border border-primary p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  After verification, you{'\''}ll receive backup codes. Save them in a secure location to regain access if you lose your authenticator device.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Link */}
        <div className="text-center">
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Cancel and go back
          </Link>
        </div>
      </div>
    </div>
  );
}
