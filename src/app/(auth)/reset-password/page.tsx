'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { LockClosedIcon, CheckCircledIcon, CrossCircledIcon, ArrowLeftIcon } from '@radix-ui/react-icons';
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
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';

// Validation schema
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordResponse {
  data?: {
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password', '');

  // Extract token from URL on mount
  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (!tokenParam) {
      setServerError('Invalid or missing reset token. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError('Invalid or missing reset token.');
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result: ResetPasswordResponse = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (result.error) {
          setServerError(result.error.message);
        } else {
          setServerError('An unexpected error occurred. Please try again.');
        }
        return;
      }

      // Success - show success message
      setSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <Section size="2" className="min-h-screen flex items-center justify-center">
        <Container size="1">
          <Flex direction="column" gap="6" align="center">
            <CheckCircledIcon width="64" height="64" color="green" />
            <Card className="w-full max-w-md">
              <CardHeader className="text-center space-y-4">
                <CardTitle>Password Reset Successful!</CardTitle>
                <CardDescription>
                  Your password has been successfully reset. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Button onClick={() => router.push('/login')} className="w-full">
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </Flex>
        </Container>
      </Section>
    );
  }

  // Invalid token state
  if (!token && serverError) {
    return (
      <Section size="2" className="min-h-screen flex items-center justify-center">
        <Container size="1">
          <Flex direction="column" gap="6" align="center">
            <CrossCircledIcon width="64" height="64" color="red" />
            <Card className="w-full max-w-md">
              <CardHeader className="text-center space-y-4">
                <CardTitle>Invalid Reset Link</CardTitle>
                <CardDescription>{serverError}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Link href="/forgot-password" className="w-full">
                  <Button className="w-full">Request New Reset Link</Button>
                </Link>

                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    Back to Login
                  </Link>
                </p>
              </CardContent>
            </Card>
          </Flex>
        </Container>
      </Section>
    );
  }

  // Reset password form
  return (
    <Section size="2" className="min-h-screen flex items-center justify-center">
      <Container size="1">
        <Flex direction="column" gap="6" align="center">
          {/* Logo/Brand */}
          <Flex direction="column" gap="2" align="center">
            <LockClosedIcon width="48" height="48" color="teal" />
            <Heading size="8" weight="bold" align="center">
              Set New Password
            </Heading>
            <Text size="3" color="gray" align="center">
              Choose a strong password for your account
            </Text>
          </Flex>

          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Server Error Message */}
            <FormError message={serverError || undefined} />

            <div className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  <Flex align="center" gap="2">
                    <LockClosedIcon /> New password
                  </Flex>
                </Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  placeholder="••••••••"
                  error={!!errors.password}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                {errors.password && (
                  <p className="text-sm text-destructive" id="password-error" role="alert">
                    {errors.password.message}
                  </p>
                )}
                
                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator password={password} />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  <Flex align="center" gap="2">
                    <LockClosedIcon /> Confirm new password
                  </Flex>
                </Label>
                <Input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  error={!!errors.confirmPassword}
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive" id="confirmPassword-error" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !token}
              loading={loading}
              className="w-full"
              aria-label={loading ? 'Resetting password...' : 'Reset password'}
            >
              {loading ? 'Resetting password...' : 'Reset password'}
            </Button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded inline-flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </Flex>
  </Container>
</Section>
  );
}
