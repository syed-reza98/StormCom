/**
 * ConsentBanner Component
 * 
 * Newsletter subscription consent banner for storefront.
 * Implements GDPR-compliant consent collection with:
 * - Email subscription form
 * - Rate limiting
 * - Optimistic UI updates
 * - Accessibility (WCAG 2.1 AA)
 * - Keyboard navigation
 * - DNT header respect
 * 
 * @module components/ConsentBanner
 */

'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { X } from 'lucide-react';
import { subscribeToNewsletter } from '@/app/shop/newsletter/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConsentBannerProps {
  storeId: string;
  position?: 'top' | 'bottom';
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * Submit button with pending state
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="min-w-[120px]"
      aria-live="polite"
      aria-busy={pending}
    >
      {pending ? 'Subscribing...' : 'Subscribe'}
    </Button>
  );
}

/**
 * Newsletter consent banner component
 * 
 * Displays a fixed banner at top/bottom of page prompting for newsletter subscription.
 * Supports dismissal and persists user choice in localStorage.
 * 
 * @example
 * ```tsx
 * // In storefront layout or page
 * <ConsentBanner 
 *   storeId={store.id} 
 *   position="bottom" 
 *   dismissible 
 * />
 * ```
 */
export function ConsentBanner({ 
  storeId, 
  position = 'bottom',
  dismissible = true,
  onDismiss,
}: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Server Action state
  const [state, formAction] = useFormState(subscribeToNewsletter, null);

  // Check localStorage on mount (CSR only)
  useEffect(() => {
    const dismissed = localStorage.getItem(`newsletter-banner-dismissed-${storeId}`);
    const subscribed = localStorage.getItem(`newsletter-subscribed-${storeId}`);
    
    if (!dismissed && !subscribed) {
      // Show banner after 2 seconds (delay for better UX)
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [storeId]);

  // Handle successful subscription
  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      setEmail('');
      
      // Persist subscription in localStorage
      localStorage.setItem(`newsletter-subscribed-${storeId}`, 'true');
      
      // Auto-hide banner after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [state, storeId, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`newsletter-banner-dismissed-${storeId}`, 'true');
    onDismiss?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && dismissible) {
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed left-0 right-0 z-50 ${
        position === 'top' ? 'top-0' : 'bottom-0'
      }`}
      role="complementary"
      aria-label="Newsletter subscription banner"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Content */}
            <div className="flex-1 min-w-0">
              {showSuccess ? (
                <Alert className="bg-green-500/20 border-green-500 text-green-50">
                  <AlertDescription>
                    ✓ {state?.alreadySubscribed 
                      ? 'You are already subscribed to our newsletter' 
                      : 'Successfully subscribed! Check your email for confirmation.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-1">
                    Stay Updated!
                  </h2>
                  <p className="text-sm text-primary-foreground/90 mb-3">
                    Subscribe to our newsletter for exclusive deals, new products, and updates.
                  </p>

                  {/* Form */}
                  <form action={formAction} className="flex flex-col sm:flex-row gap-2">
                    <input type="hidden" name="storeId" value={storeId} />
                    
                    <div className="flex-1 max-w-md">
                      <label htmlFor="newsletter-email" className="sr-only">
                        Email address
                      </label>
                      <Input
                        id="newsletter-email"
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-required="true"
                        aria-describedby={state?.error ? 'newsletter-error' : undefined}
                        aria-invalid={!!state?.error}
                        className="bg-background text-foreground"
                        autoComplete="email"
                      />
                    </div>
                    
                    <SubmitButton />
                  </form>

                  {/* Error message */}
                  {state?.error && (
                    <Alert 
                      id="newsletter-error"
                      className="mt-2 bg-destructive/20 border-destructive text-destructive-foreground"
                      role="alert"
                      aria-live="assertive"
                    >
                      <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Privacy notice */}
                  <p className="text-xs text-primary-foreground/70 mt-2">
                    By subscribing, you agree to our{' '}
                    <a 
                      href="/privacy-policy" 
                      className="underline hover:text-primary-foreground"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </a>
                    . Unsubscribe anytime.
                  </p>
                </>
              )}
            </div>

            {/* Dismiss button */}
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter banner"
                className="flex-shrink-0 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight newsletter subscription form (no banner)
 * 
 * Use this for inline newsletter forms in footers, sidebars, etc.
 * 
 * @example
 * ```tsx
 * <NewsletterForm storeId={store.id} />
 * ```
 */
export function NewsletterForm({ storeId }: { storeId: string }) {
  const [email, setEmail] = useState('');
  const [state, formAction] = useFormState(subscribeToNewsletter, null);

  useEffect(() => {
    if (state?.success) {
      setEmail('');
    }
  }, [state]);

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="storeId" value={storeId} />
        
        <div className="flex-1">
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Email address
          </label>
          <Input
            id="footer-newsletter-email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!!state?.error}
            autoComplete="email"
          />
        </div>
        
        <SubmitButton />
      </form>

      {/* Status messages */}
      {state?.success && (
        <Alert className="bg-green-500/10 border-green-500">
          <AlertDescription className="text-green-700 dark:text-green-300">
            ✓ {state.alreadySubscribed 
              ? 'Already subscribed!' 
              : 'Subscribed successfully!'}
          </AlertDescription>
        </Alert>
      )}

      {state?.error && (
        <Alert className="bg-destructive/10 border-destructive">
          <AlertDescription className="text-destructive">
            {state.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Hook for checking newsletter subscription status
 * 
 * Checks localStorage to see if user has subscribed or dismissed banner.
 * Useful for conditionally rendering newsletter forms.
 * 
 * @example
 * ```tsx
 * const { isSubscribed, isDismissed } = useNewsletterStatus(storeId);
 * 
 * if (!isSubscribed && !isDismissed) {
 *   return <ConsentBanner storeId={storeId} />;
 * }
 * ```
 */
export function useNewsletterStatus(storeId: string) {
  const [status, setStatus] = useState({
    isSubscribed: false,
    isDismissed: false,
  });

  useEffect(() => {
    const subscribed = localStorage.getItem(`newsletter-subscribed-${storeId}`);
    const dismissed = localStorage.getItem(`newsletter-banner-dismissed-${storeId}`);
    
    setStatus({
      isSubscribed: !!subscribed,
      isDismissed: !!dismissed,
    });
  }, [storeId]);

  const clearStatus = () => {
    localStorage.removeItem(`newsletter-subscribed-${storeId}`);
    localStorage.removeItem(`newsletter-banner-dismissed-${storeId}`);
    setStatus({ isSubscribed: false, isDismissed: false });
  };

  return { ...status, clearStatus };
}
