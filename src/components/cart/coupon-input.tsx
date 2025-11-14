// src/components/cart/coupon-input.tsx
// Coupon Input Component - Apply discount coupons to cart
// Pattern: shadcn Input + Button

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagIcon, XIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

interface CouponInputProps {
  onApply: (code: string) => Promise<{ success: boolean; message?: string; discount?: number }>;
  onRemove?: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
  };
}

export function CouponInput({ onApply, onRemove, appliedCoupon }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await onApply(code.trim().toUpperCase());
      
      if (result.success) {
        setSuccess(result.message || 'Coupon applied successfully');
        setCode('');
      } else {
        setError(result.message || 'Invalid coupon code');
      }
    } catch (err) {
      setError('Failed to apply coupon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
      setSuccess(null);
      setError(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="space-y-3">
      {/* Coupon Input */}
      {!appliedCoupon ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter coupon code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleApply} 
            disabled={isLoading || !code.trim()}
            variant="outline"
          >
            {isLoading ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      ) : (
        /* Applied Coupon Display */
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <div>
              <Badge variant="outline" className="bg-white text-green-800 border-green-300">
                {appliedCoupon.code}
              </Badge>
              <p className="text-sm text-green-700 mt-1">
                ${appliedCoupon.discount.toFixed(2)} discount applied
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="hover:text-destructive"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Success Message */}
      {success && !appliedCoupon && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Popular Coupons (Optional) */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground mb-2">Popular coupons:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setCode('SAVE10')}
            disabled={!!appliedCoupon}
          >
            SAVE10
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setCode('WELCOME')}
            disabled={!!appliedCoupon}
          >
            WELCOME
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setCode('FREESHIP')}
            disabled={!!appliedCoupon}
          >
            FREESHIP
          </Button>
        </div>
      </div>
    </div>
  );
}
