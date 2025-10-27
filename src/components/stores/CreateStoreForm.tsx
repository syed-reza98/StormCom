'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

// Form validation schema
const createStoreSchema = z.object({
  name: z
    .string()
    .min(2, 'Store name must be at least 2 characters')
    .max(50, 'Store name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Store name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(20, 'Subdomain must be less than 20 characters')
    .regex(/^[a-z0-9\-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z]/, 'Subdomain must start with a letter')
    .regex(/[a-z0-9]$/, 'Subdomain must end with a letter or number'),
  
  ownerEmail: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters'),
  
  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
});

type CreateStoreFormData = z.infer<typeof createStoreSchema>;

interface FormErrors {
  name?: string;
  subdomain?: string;
  ownerEmail?: string;
  description?: string;
  submit?: string;
}

/**
 * Create Store Form Component
 * 
 * Handles the creation of new stores with proper validation, subdomain availability
 * checking, and user assignment. Uses Zod for form validation and provides
 * real-time feedback to users.
 */
export function CreateStoreForm() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<CreateStoreFormData>({
    name: '',
    subdomain: '',
    ownerEmail: '',
    description: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  /**
   * Generate subdomain from store name
   */
  const generateSubdomain = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 20); // Limit length
  };

  /**
   * Handle input changes with real-time validation
   */
  const handleInputChange = (field: keyof CreateStoreFormData, value: string) => {
    // Update form data
    const updatedData = { ...formData, [field]: value };
    
    // Auto-generate subdomain from name
    if (field === 'name' && !formData.subdomain) {
      updatedData.subdomain = generateSubdomain(value);
    }
    
    setFormData(updatedData);
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validate specific field
    try {
      if (field === 'name') {
        createStoreSchema.shape.name.parse(value);
      } else if (field === 'subdomain') {
        createStoreSchema.shape.subdomain.parse(value);
        // Check subdomain availability after a delay
        if (value && value.length >= 3) {
          checkSubdomainAvailability(value);
        } else {
          setSubdomainAvailable(null);
        }
      } else if (field === 'ownerEmail') {
        createStoreSchema.shape.ownerEmail.parse(value);
      } else if (field === 'description') {
        createStoreSchema.shape.description?.parse(value);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
    }
  };

  /**
   * Check subdomain availability (debounced)
   */
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (isCheckingSubdomain) return;
    
    setIsCheckingSubdomain(true);
    setSubdomainAvailable(null);
    
    try {
      // Simulate API call to check subdomain availability
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock logic: subdomains containing 'taken' are unavailable
      const isAvailable = !subdomain.includes('taken');
      setSubdomainAvailable(isAvailable);
      
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, subdomain: 'This subdomain is already taken' }));
      }
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Validate form data
      const validatedData = createStoreSchema.parse(formData);
      
      // Check subdomain availability one more time
      if (subdomainAvailable === false) {
        setErrors({ subdomain: 'Please choose a different subdomain' });
        return;
      }
      
      // Submit to API
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.error?.code === 'VALIDATION_ERROR') {
          // Handle validation errors from server
          const serverErrors: FormErrors = {};
          if (result.error.details) {
            Object.keys(result.error.details).forEach(field => {
              if (field in serverErrors) {
                serverErrors[field as keyof FormErrors] = result.error.details[field][0];
              }
            });
          }
          setErrors(serverErrors);
        } else {
          setErrors({ submit: result.error?.message || 'Failed to create store' });
        }
        return;
      }
      
      // Success - redirect to store details
      router.push(`/dashboard/stores/${result.data.id}`);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const formErrors: FormErrors = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof FormErrors;
          formErrors[field] = err.message;
        });
        setErrors(formErrors);
      } else {
        console.error('Create store error:', error);
        setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Store Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="My Awesome Store"
          maxLength={50}
          required
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          This will be displayed as your store's public name
        </p>
      </div>

      {/* Subdomain */}
      <div>
        <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
          Subdomain
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex">
          <input
            type="text"
            id="subdomain"
            value={formData.subdomain}
            onChange={(e) => handleInputChange('subdomain', e.target.value)}
            className={`flex-1 px-3 py-2 border rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.subdomain ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="my-store"
            maxLength={20}
            required
          />
          <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
            .stormcom.app
          </span>
        </div>
        
        {/* Subdomain availability indicator */}
        {formData.subdomain && formData.subdomain.length >= 3 && (
          <div className="mt-1 flex items-center">
            {isCheckingSubdomain ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-indigo-600 rounded-full mr-2" />
                <span className="text-sm text-gray-600">Checking availability...</span>
              </>
            ) : subdomainAvailable === true ? (
              <>
                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-600">Subdomain is available</span>
              </>
            ) : subdomainAvailable === false ? (
              <>
                <svg className="h-4 w-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm text-red-600">Subdomain is not available</span>
              </>
            ) : null}
          </div>
        )}
        
        {errors.subdomain && (
          <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Your store will be accessible at {formData.subdomain || 'your-subdomain'}.stormcom.app
        </p>
      </div>

      {/* Owner Email */}
      <div>
        <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Store Owner Email
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="email"
          id="ownerEmail"
          value={formData.ownerEmail}
          onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.ownerEmail ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="owner@example.com"
          maxLength={100}
          required
        />
        {errors.ownerEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.ownerEmail}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          The email address of the person who will own and manage this store
        </p>
      </div>

      {/* Description (Optional) */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
          <span className="text-gray-400 ml-1">(Optional)</span>
        </label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Brief description of your store (optional)"
          maxLength={200}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.description ? `${formData.description.length}/200` : '0/200'} characters
        </p>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error creating store</h3>
              <p className="mt-1 text-sm text-red-700">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isLoading || subdomainAvailable === false}
          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Creating Store...
            </>
          ) : (
            'Create Store'
          )}
        </button>
      </div>
    </form>
  );
}