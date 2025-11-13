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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login Page - Refactored Example
 * 
 * This is an example refactored version demonstrating:
 * - shadcn/ui Form component with React Hook Form + Zod
 * - Toast notifications for user feedback
 * - Proper accessibility (ARIA labels, focus management)
 * - Server Components-first architecture (Client component for form only)
 * 
 * Original: src/app/(auth)/login/page.tsx
 */
export default function LoginPageRefactored() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      // Use NextAuth signIn with credentials provider
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false, // Don't redirect automatically
      });

      if (!result) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (result.error) {
        // NextAuth returns error as string
        // Parse common error codes
        if (result.error === 'CredentialsSignin') {
          toast({
            title: 'Login Failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        } else if (result.error === 'ACCOUNT_LOCKED') {
          toast({
            title: 'Account Locked',
            description: 'Your account has been locked due to too many failed login attempts.',
            variant: 'destructive',
          });
        } else if (result.error === 'EMAIL_NOT_VERIFIED') {
          toast({
            title: 'Email Not Verified',
            description: 'Please verify your email address before logging in.',
            variant: 'destructive',
          });
        } else if (result.error === 'MFA_REQUIRED') {
          // Redirect to MFA challenge page
          router.push('/mfa/challenge');
          return;
        } else {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
        }
        return;
      }

      // Success - show toast and redirect
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

      router.push('/dashboard');
      router.refresh(); // Refresh to update session on server
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Network Error',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
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
              {/* Login Form - Using shadcn/ui Form component */}
              <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Flex align="center" gap="2">
                            <EnvelopeClosedIcon />
                            Email address
                          </Flex>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Flex align="center" gap="2">
                            <LockClosedIcon />
                            Password
                          </Flex>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                    className="w-full"
                    disabled={loading || form.formState.isSubmitting}
                  >
                    {loading || form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </Form>

              {/* Social Login Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  disabled={loading}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                  >
                    <path
                      fill="currentColor"
                      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    ></path>
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </CardContent>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
