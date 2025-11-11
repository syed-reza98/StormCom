/**
 * ShippingAddressForm: Form for collecting shipping address
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ShippingAddress } from '@/services/checkout-service';

const ShippingAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(10, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  state: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
});

type ShippingAddressFormData = z.infer<typeof ShippingAddressSchema>;

interface ShippingAddressFormProps {
  onComplete: (address: ShippingAddress) => void;
}

export function ShippingAddressForm({ onComplete }: ShippingAddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingAddressFormData>({
    resolver: zodResolver(ShippingAddressSchema),
  });

  const onSubmit = async (data: ShippingAddressFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API validation
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      onComplete(data as ShippingAddress);
    } catch (error) {
      console.error('Address validation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          {...register('fullName')}
          type="text"
          id="fullName"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email (optional) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email (optional)
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          {...register('phone')}
          type="tel"
          id="phone"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+1 (555) 123-4567"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 *
        </label>
        <input
          {...register('address1')}
          type="text"
          id="address1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="123 Main St"
        />
        {errors.address1 && (
          <p className="mt-1 text-sm text-red-600">{errors.address1.message}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 (optional)
        </label>
        <input
          {...register('address2')}
          type="text"
          id="address2"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Apt 4B"
        />
      </div>

      {/* City, State, Postal Code */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            {...register('city')}
            type="text"
            id="city"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="New York"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State (optional)
          </label>
          <input
            {...register('state')}
            type="text"
            id="state"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="NY"
          />
        </div>

        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
            Postal Code *
          </label>
          <input
            {...register('postalCode')}
            type="text"
            id="postalCode"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="10001"
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      {/* Country */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
          Country *
        </label>
        <select
          {...register('country')}
          id="country"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select country</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="JP">Japan</option>
        </select>
        {errors.country && (
          <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Validating...' : 'Continue to Payment'}
        </button>
      </div>
    </form>
  );
}
