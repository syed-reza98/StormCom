'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { storeNameSchema } from '@/lib/validation';

// Store settings validation schema
const storeSettingsSchema = z.object({
  name: storeNameSchema,
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  logo: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters'),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(200, 'Address must be less than 200 characters')
    .optional(),
  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional(),
  state: z
    .string()
    .max(50, 'State must be less than 50 characters')
    .optional(),
  postalCode: z
    .string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional(),
  country: z
    .string()
    .min(2, 'Country is required')
    .max(2, 'Country must be a 2-letter code'),
  currency: z
    .string()
    .min(3, 'Currency is required')
    .max(3, 'Currency must be a 3-letter code'),
  timezone: z
    .string()
    .min(1, 'Timezone is required'),
  locale: z
    .string()
    .min(2, 'Locale is required'),
  // Theme settings
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color')
    .optional()
    .or(z.literal('')),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color')
    .optional()
    .or(z.literal('')),
  accentColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color')
    .optional()
    .or(z.literal('')),
  fontFamily: z
    .enum(['inter', 'roboto', 'poppins', 'montserrat', 'playfair', 'opensans'])
    .optional(),
});

type StoreSettingsFormData = z.infer<typeof storeSettingsSchema>;

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  currency: string;
  timezone: string;
  locale: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  locale?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  submit?: string;
}

interface StoreSettingsFormProps {
  store: Store;
  themeSettings?: ThemeSettings;
  onSave?: (data: StoreSettingsFormData) => void;
  onCancel?: () => void;
}

/**
 * Store Settings Form Component
 * 
 * Comprehensive form for updating store settings including basic information,
 * contact details, address, and theme configuration. Supports logo upload
 * and provides real-time validation feedback.
 */
export function StoreSettingsForm({ 
  store, 
  themeSettings = {},
  onSave,
  onCancel 
}: StoreSettingsFormProps) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<StoreSettingsFormData>({
    name: store.name,
    description: store.description || '',
    logo: store.logo || '',
    email: store.email,
    phone: store.phone || '',
    website: store.website || '',
    address: store.address || '',
    city: store.city || '',
    state: store.state || '',
    postalCode: store.postalCode || '',
    country: store.country,
    currency: store.currency,
    timezone: store.timezone,
    locale: store.locale,
    primaryColor: themeSettings.primaryColor || '',
    secondaryColor: themeSettings.secondaryColor || '',
    accentColor: themeSettings.accentColor || '',
    fontFamily: (themeSettings.fontFamily && 
      ['inter', 'roboto', 'poppins', 'montserrat', 'playfair', 'opensans'].includes(themeSettings.fontFamily)
      ? themeSettings.fontFamily as 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'playfair' | 'opensans'
      : undefined
    ),
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logo || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Available options
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
  ];

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  const locales = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
  ];

  const fontFamilies = [
    { value: 'inter', name: 'Inter' },
    { value: 'roboto', name: 'Roboto' },
    { value: 'poppins', name: 'Poppins' },
    { value: 'montserrat', name: 'Montserrat' },
    { value: 'playfair', name: 'Playfair Display' },
    { value: 'opensans', name: 'Open Sans' },
  ];

  /**
   * Handle input changes with real-time validation
   */
  const handleInputChange = (field: keyof StoreSettingsFormData, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value || '' }));
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validate specific field
    try {
      const fieldSchema = storeSettingsSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
    }
  };

  /**
   * Handle logo file upload
   */
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, logo: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'Image must be less than 2MB' }));
      return;
    }

    setUploadingLogo(true);
    
    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      // Upload to Vercel Blob (mock implementation)
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const result = await response.json();
      
      // Update form data with uploaded URL
      handleInputChange('logo', result.url);
      setErrors(prev => ({ ...prev, logo: undefined }));
      
    } catch (error) {
      console.error('Logo upload error:', error);
      setErrors(prev => ({ ...prev, logo: 'Failed to upload logo. Please try again.' }));
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
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
      const validatedData = storeSettingsSchema.parse(formData);
      
      if (onSave) {
        // Use provided callback
        onSave(validatedData);
      } else {
        // Default API submission
        const response = await fetch(`/api/stores/${store.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validatedData),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          if (result.error?.code === 'VALIDATION_ERROR') {
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
            setErrors({ submit: result.error?.message || 'Failed to update store settings' });
          }
          return;
        }
        
        // Success - redirect or show success message
        router.push(`/dashboard/stores/${store.id}`);
      }
      
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
        console.error('Update store error:', error);
        setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              maxLength={100}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={100}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.website ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Brief description of your store"
            maxLength={500}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description?.length || 0}/500 characters
          </p>
        </div>

        {/* Logo Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Logo
          </label>
          <div className="flex items-start space-x-4">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {logoPreview ? (
                <div className="h-20 w-20 relative border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={logoPreview}
                    alt="Store logo preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Upload Input */}
            <div className="flex-1">
              <input
                type="file"
                id="logo"
                aria-label="Upload store logo"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                disabled={uploadingLogo}
              />
              <p className="mt-1 text-sm text-gray-500">
                PNG, JPG, or GIF up to 2MB
              </p>
              {uploadingLogo && (
                <p className="mt-1 text-sm text-indigo-600">Uploading...</p>
              )}
            </div>
          </div>
          {errors.logo && (
            <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Address</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="123 Main Street"
              maxLength={200}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={100}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              State/Province
            </label>
            <input
              type="text"
              id="state"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.state ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={50}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>

          {/* Postal Code */}
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.postalCode ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={20}
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.country ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-1 text-sm text-red-600">{errors.country}</p>
            )}
          </div>
        </div>
      </div>

      {/* Localization Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Localization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.currency ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.timezone ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              {timezones.map(timezone => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600">{errors.timezone}</p>
            )}
          </div>

          {/* Locale */}
          <div>
            <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-2">
              Language
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="locale"
              value={formData.locale}
              onChange={(e) => handleInputChange('locale', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.locale ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              {locales.map(locale => (
                <option key={locale.code} value={locale.code}>
                  {locale.name}
                </option>
              ))}
            </select>
            {errors.locale && (
              <p className="mt-1 text-sm text-red-600">{errors.locale}</p>
            )}
          </div>
        </div>
      </div>

      {/* Theme Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Theme Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Primary Color */}
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                id="primaryColor"
                value={formData.primaryColor || '#3B82F6'}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="h-10 w-16 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor || ''}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.primaryColor ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="#3B82F6"
              />
            </div>
            {errors.primaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryColor}</p>
            )}
          </div>

          {/* Secondary Color */}
          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                id="secondaryColor"
                value={formData.secondaryColor || '#6B7280'}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className="h-10 w-16 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor || ''}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.secondaryColor ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="#6B7280"
              />
            </div>
            {errors.secondaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.secondaryColor}</p>
            )}
          </div>

          {/* Accent Color */}
          <div>
            <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                id="accentColor"
                value={formData.accentColor || '#10B981'}
                onChange={(e) => handleInputChange('accentColor', e.target.value)}
                className="h-10 w-16 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={formData.accentColor || ''}
                onChange={(e) => handleInputChange('accentColor', e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.accentColor ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="#10B981"
              />
            </div>
            {errors.accentColor && (
              <p className="mt-1 text-sm text-red-600">{errors.accentColor}</p>
            )}
          </div>

          {/* Font Family */}
          <div>
            <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              id="fontFamily"
              value={formData.fontFamily || ''}
              onChange={(e) => handleInputChange('fontFamily', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.fontFamily ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Default</option>
              {fontFamilies.map(font => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
            {errors.fontFamily && (
              <p className="mt-1 text-sm text-red-600">{errors.fontFamily}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error updating store settings</h3>
              <p className="mt-1 text-sm text-red-700">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isLoading || uploadingLogo}
          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Updating Settings...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </form>
  );
}