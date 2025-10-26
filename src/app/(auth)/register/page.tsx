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
import { FormSuccess } from '@/components/auth/form-success';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';

// Validation schema
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterResponse {
  data?: {
    userId: string;
    email: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setServerError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: RegisterResponse = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (result.error) {
          setServerError(result.error.message);
        } else {
          setServerError('An unexpected error occurred. Please try again.');
        }
        return;
      }

      // Success - show verification notice
      setSuccess(true);
      setRegisteredEmail(data.email);
    } catch (error) {
      console.error('Registration error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-balance">Registration Successful!</CardTitle>
            <CardDescription className="space-y-2">
              <p>We've sent a verification email to:</p>
              <p className="text-lg font-semibold text-foreground">{registeredEmail}</p>
              <p className="text-sm">
                Please check your inbox and click the verification link to activate your account.
              </p>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Go to Login
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn't receive the email?{' '}
              <button
                onClick={() => setSuccess(false)}
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                Try again
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Sign in
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Server Error Message */}
            <FormError message={serverError || undefined} />

            <div className="space-y-4">
              {/* First Name Field */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  {...register('firstName')}
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="John"
                  error={!!errors.firstName}
                  aria-invalid={errors.firstName ? 'true' : 'false'}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive" id="firstName-error" role="alert">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name Field */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  {...register('lastName')}
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  error={!!errors.lastName}
                  aria-invalid={errors.lastName ? 'true' : 'false'}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive" id="lastName-error" role="alert">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
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
                  <p className="text-sm text-destructive" id="email-error" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
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
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
              aria-label={loading ? 'Creating account...' : 'Create account'}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link
                href="/terms"
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                Privacy Policy
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
