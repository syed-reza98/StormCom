'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { LockClosedIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';
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

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  data?: {
    sessionId: string;
    user: {
      id: string;
      email: string;
      role: string;
      storeId?: string;
    };
    requiresMFA: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Track client-side mounting to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setServerError(null);
    setLockedUntil(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies
      });

      const result: LoginResponse = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (result.error) {
          if (result.error.code === 'ACCOUNT_LOCKED' && result.error.details?.lockedUntil) {
            setLockedUntil(new Date(result.error.details.lockedUntil));
          }
          setServerError(result.error.message);
        } else {
          setServerError('An unexpected error occurred. Please try again.');
        }
        return;
      }

      // Success - check if MFA is required
      if (result.data?.requiresMFA) {
        router.push('/mfa/challenge');
      } else {
        // Check user role for redirect
        if (result.data?.user.role === 'SuperAdmin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section size="3" className="min-h-screen flex items-center justify-center py-12">
      <Container size="1">
        <Flex direction="column" gap="8" align="center">
          {/* Logo/Brand */}
          <Flex direction="column" gap="3" align="center">
            <div 
              className="p-4 rounded-2xl" 
              style={{ backgroundColor: 'var(--teal-3)' }}
            >
              <LockClosedIcon 
                width="32" 
                height="32" 
                style={{ color: 'var(--teal-9)' }} 
                aria-hidden="true"
              />
            </div>
            <Heading size="8" weight="bold" align="center">
              Welcome Back
            </Heading>
            <Text size="4" color="gray" align="center" className="max-w-md">
              Sign in to your StormCom account
            </Text>
          </Flex>

          {/* Login Card */}
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center space-y-2">
              <CardTitle>Sign in to continue</CardTitle>
              <CardDescription>
                Or{' '}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  create a new account
                </Link>
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Login Form */}
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Server Error Message */}
                <FormError
                  message={
                    serverError
                      ? lockedUntil && isMounted
                        ? `${serverError} Your account is locked until ${lockedUntil.toLocaleString()}`
                        : serverError
                      : undefined
                  }
                />

                <div className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Flex align="center" gap="2">
                        <EnvelopeClosedIcon aria-hidden="true" />
                        <span>Email address</span>
                      </Flex>
                    </Label>
                    <Input
                      {...register('email')}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      error={!!errors.email}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p
                        className="text-sm text-destructive"
                        id="email-error"
                        role="alert"
                      >
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      <Flex align="center" gap="2">
                        <LockClosedIcon aria-hidden="true" />
                        <span>Password</span>
                      </Flex>
                    </Label>
                    <Input
                      {...register('password')}
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      error={!!errors.password}
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    {errors.password && (
                      <p
                        className="text-sm text-destructive"
                        id="password-error"
                        role="alert"
                      >
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="w-full"
                  size="lg"
                  aria-label={loading ? 'Signing in...' : 'Sign in'}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>

                {/* Footer Links */}
                <div className="text-center text-sm text-muted-foreground pt-2">
                  <p>
                    Don&apos;t have an account?{' '}
                    <Link
                      href="/register"
                      className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                    >
                      Create account
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
