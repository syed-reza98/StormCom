'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const deletionSchema = z.object({
  confirmEmail: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  confirmDeletion: z.boolean().refine((val) => val === true, {
    message: 'You must confirm account deletion',
  }),
  acknowledgeConsequences: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the consequences',
  }),
});

type DeletionFormData = z.infer<typeof deletionSchema>;

interface AccountDeletionConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  onConfirm?: (data: DeletionFormData) => Promise<void>;
  onDeactivateInstead?: () => void;
}

export default function AccountDeletionConfirmation({
  open,
  onOpenChange,
  userEmail,
  onConfirm,
  onDeactivateInstead,
}: AccountDeletionConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<DeletionFormData>({
    resolver: zodResolver(deletionSchema),
    defaultValues: {
      confirmEmail: '',
      password: '',
      confirmDeletion: false,
      acknowledgeConsequences: false,
    },
  });

  const handleSubmit = async (data: DeletionFormData) => {
    if (data.confirmEmail !== userEmail) {
      form.setError('confirmEmail', {
        message: 'Email does not match your account email',
      });
      return;
    }

    if (!onConfirm) return;

    setIsDeleting(true);
    try {
      await onConfirm(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const consequences = [
    'All your personal data will be permanently deleted',
    'Your order history will be anonymized and cannot be recovered',
    'Any active subscriptions will be cancelled immediately',
    'You will lose access to all saved addresses and payment methods',
    'Your wishlist and shopping cart will be cleared',
    'This action cannot be undone',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone
          </DialogDescription>
        </DialogHeader>

        {/* Warning Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Irreversible Action</AlertTitle>
          <AlertDescription>
            Deleting your account will permanently remove all your data from our systems.
            This action cannot be reversed.
          </AlertDescription>
        </Alert>

        {/* Consequences */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">What will happen:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {consequences.map((consequence, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>{consequence}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Email Confirmation */}
            <FormField
              control={form.control}
              name="confirmEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Your Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={userEmail}
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Confirmation */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Acknowledgements */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="acknowledgeConsequences"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      I understand that all my data will be permanently deleted and this
                      action cannot be undone
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmDeletion"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      I confirm that I want to permanently delete my account
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data Retention Notice */}
            <Alert>
              <AlertDescription className="text-xs">
                <strong>Data Retention Policy:</strong> In accordance with GDPR Article 17
                (Right to Erasure), your personal data will be deleted within 30 days.
                However, we may retain certain information for legal and accounting purposes
                as required by law (typically 7 years for transaction records).
              </AlertDescription>
            </Alert>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {onDeactivateInstead && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDeactivateInstead}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  Deactivate Instead
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
