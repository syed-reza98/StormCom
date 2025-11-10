'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
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

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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

    try {
      // Use NextAuth signIn with credentials provider
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false, // Don't redirect automatically
      });

      if (!result) {
        setServerError('An unexpected error occurred. Please try again.');
        return;
      }

      if (result.error) {
        // NextAuth returns error as string
        // Parse common error codes
        if (result.error === 'CredentialsSignin') {
          setServerError('Invalid email or password. Please try again.');
        } else if (result.error === 'ACCOUNT_LOCKED') {
          setServerError('Your account has been locked due to too many failed login attempts.');
        } else if (result.error === 'EMAIL_NOT_VERIFIED') {
          setServerError('Please verify your email address before logging in.');
        } else if (result.error === 'MFA_REQUIRED') {
          // Redirect to MFA challenge page
          router.push('/mfa/challenge');
          return;
        } else {
          setServerError(result.error);
        }
        return;
      }

      // Success - redirect based on user role
      // NextAuth session will be available after successful sign in
      router.push('/dashboard');
      router.refresh(); // Refresh to update session on server
    } catch (error) {
      console.error('Login error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section size="2" className="min-h-screen flex items-center justify-center">
      <Container size="1">
        <Flex direction="column" gap="6" align="center">
          {/* Logo/Brand */}
          <Flex direction="column" gap="2" align="center">
            <LockClosedIcon width="48" height="48" color="teal" />
            <Heading size="8" weight="bold" align="center">
              Welcome Back
            </Heading>
            <Text size="3" color="gray" align="center">
              Sign in to your StormCom account
            </Text>
          </Flex>

          {/* Login Card */}
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Sign in to continue</CardTitle>
              <CardDescription>
                Or{' '}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                >
                  create a new account
                </Link>
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Login Form */}
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Server Error Message */}
                <FormError message={serverError ?? undefined} />

                <div className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Flex align="center" gap="2">
                        <EnvelopeClosedIcon />
                        Email address
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
                        <LockClosedIcon />
                        Password
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
                    className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
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
                  aria-label={loading ? 'Signing in...' : 'Sign in'}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>

                {/* Footer Links */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Don{'\''}t have an account?{' '}
                    <Link
                      href="/register"
                      className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
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
