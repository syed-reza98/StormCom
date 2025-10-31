'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { QuestionMarkCircledIcon, EnvelopeClosedIcon, ArrowLeftIcon, CheckCircledIcon } from '@radix-ui/react-icons';
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
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordResponse {
  data?: {
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setServerError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ForgotPasswordResponse = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (result.error) {
          setServerError(result.error.message);
        } else {
          setServerError('An unexpected error occurred. Please try again.');
        }
        return;
      }

      // Success - always show success message for security
      setSuccess(true);
      setSubmittedEmail(data.email);
    } catch (error) {
      console.error('Forgot password error:', error);
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
                <CardTitle>Check your email</CardTitle>
                <CardDescription className="space-y-2">
                  <p>
                    If an account exists with <strong className="text-foreground">{submittedEmail}</strong>, we&apos;ve sent
                    password reset instructions.
                  </p>
                  <p className="text-sm">
                    Please check your inbox and spam folder. The link will expire in 1 hour.
                  </p>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Link href="/login" className="w-full">
                  <Button className="w-full">Back to Login</Button>
                </Link>

                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive the email?{' '}
                  <button
                    onClick={() => setSuccess(false)}
                    className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    Try again
                  </button>
                </p>
              </CardContent>
            </Card>
          </Flex>
        </Container>
      </Section>
    );
  }

  // Forgot password form
  return (
    <Section size="2" className="min-h-screen flex items-center justify-center">
      <Container size="1">
        <Flex direction="column" gap="6" align="center">
          {/* Logo/Brand */}
          <Flex direction="column" gap="2" align="center">
            <QuestionMarkCircledIcon width="48" height="48" color="amber" />
            <Heading size="8" weight="bold" align="center">
              Reset Password
            </Heading>
            <Text size="3" color="gray" align="center">
              Enter your email to receive reset instructions
            </Text>
          </Flex>

          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Forgot password?</CardTitle>
              <CardDescription>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </CardDescription>
            </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Server Error Message */}
            <FormError message={serverError || undefined} />

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">
                <Flex align="center" gap="2">
                  <EnvelopeClosedIcon /> Email address
                </Flex>
              </Label>
              <Input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
              aria-label={loading ? 'Sending reset link...' : 'Send reset link'}
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
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
