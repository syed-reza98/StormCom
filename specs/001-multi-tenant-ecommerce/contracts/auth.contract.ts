import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS (Reusable)
// ============================================================================

const emailSchema = z.string().email({ message: 'Invalid email address' });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
  );

const totpCodeSchema = z
  .string()
  .length(6, 'TOTP code must be exactly 6 digits')
  .regex(/^\d{6}$/, 'TOTP code must contain only digits');

// ============================================================================
// LOGIN
// ============================================================================

export const loginContract = {
  method: 'POST' as const,
  path: '/api/auth/login',
  authRequired: false,
  rateLimitTier: 'public' as const,

  requestSchema: z.object({
    email: emailSchema,
    password: z.string(), // Don't validate password format on login (already hashed)
    rememberMe: z.boolean().optional(),
  }),

  responseSchema: z.object({
    data: z.object({
      user: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string(),
        role: z.enum(['SUPER_ADMIN', 'STORE_ADMIN', 'STAFF', 'CUSTOMER']),
        storeId: z.string().uuid().nullable(),
        mfaEnabled: z.boolean(),
      }),
      requiresMfa: z.boolean(),
      token: z.string().optional(), // Only present if MFA not required
      expiresAt: z.string().datetime().optional(),
    }),
    message: z.string().optional(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['VALIDATION_ERROR', 'INVALID_CREDENTIALS', 'ACCOUNT_LOCKED', 'EMAIL_NOT_VERIFIED']),
      message: z.string(),
      changes: z.any().optional(),
    }),
  }),
};

export type LoginRequest = z.infer<typeof loginContract.requestSchema>;
export type LoginResponse = z.infer<typeof loginContract.responseSchema>;
export type LoginError = z.infer<typeof loginContract.errorSchema>;

// ============================================================================
// REGISTER
// ============================================================================

export const registerContract = {
  method: 'POST' as const,
  path: '/api/auth/register',
  authRequired: false,
  rateLimitTier: 'public' as const,

  requestSchema: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g., +12025551234)').optional(),
    acceptsMarketing: z.boolean().optional(),
  }),

  responseSchema: z.object({
    data: z.object({
      user: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string(),
        role: z.enum(['CUSTOMER']), // New registrations are always CUSTOMER
        emailVerified: z.boolean(),
      }),
      verificationEmailSent: z.boolean(),
    }),
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['VALIDATION_ERROR', 'EMAIL_ALREADY_EXISTS', 'RATE_LIMIT_EXCEEDED']),
      message: z.string(),
      changes: z.any().optional(),
    }),
  }),
};

export type RegisterRequest = z.infer<typeof registerContract.requestSchema>;
export type RegisterResponse = z.infer<typeof registerContract.responseSchema>;
export type RegisterError = z.infer<typeof registerContract.errorSchema>;

// ============================================================================
// LOGOUT
// ============================================================================

export const logoutContract = {
  method: 'POST' as const,
  path: '/api/auth/logout',
  authRequired: true,
  rateLimitTier: 'authenticated' as const,

  requestSchema: z.object({
    allDevices: z.boolean().optional(), // If true, invalidate all sessions
  }),

  responseSchema: z.object({
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['UNAUTHORIZED']),
      message: z.string(),
    }),
  }),
};

export type LogoutRequest = z.infer<typeof logoutContract.requestSchema>;
export type LogoutResponse = z.infer<typeof logoutContract.responseSchema>;
export type LogoutError = z.infer<typeof logoutContract.errorSchema>;

// ============================================================================
// MFA ENROLLMENT
// ============================================================================

export const mfaEnrollContract = {
  method: 'POST' as const,
  path: '/api/auth/mfa/enroll',
  authRequired: true,
  rateLimitTier: 'authenticated' as const,

  requestSchema: z.object({
    method: z.enum(['TOTP', 'SMS']),
    phoneNumber: z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format')
      .optional(), // Required if method is SMS
  }),

  responseSchema: z.object({
    data: z.object({
      method: z.enum(['TOTP', 'SMS']),
      totpSecret: z.string().optional(), // Only for TOTP method (base32 encoded)
      totpQrCodeUrl: z.string().url().optional(), // QR code data URL for TOTP
      backupCodes: z.array(z.string()).length(10), // 10 single-use backup codes (plaintext - user must save)
    }),
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['UNAUTHORIZED', 'MFA_ALREADY_ENABLED', 'VALIDATION_ERROR']),
      message: z.string(),
      changes: z.any().optional(),
    }),
  }),
};

export type MfaEnrollRequest = z.infer<typeof mfaEnrollContract.requestSchema>;
export type MfaEnrollResponse = z.infer<typeof mfaEnrollContract.responseSchema>;
export type MfaEnrollError = z.infer<typeof mfaEnrollContract.errorSchema>;

// ============================================================================
// MFA VERIFICATION (During Enrollment)
// ============================================================================

export const mfaVerifyEnrollmentContract = {
  method: 'POST' as const,
  path: '/api/auth/mfa/verify-enrollment',
  authRequired: true,
  rateLimitTier: 'authenticated' as const,

  requestSchema: z.object({
    code: totpCodeSchema,
  }),

  responseSchema: z.object({
    data: z.object({
      mfaEnabled: z.boolean(),
    }),
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['UNAUTHORIZED', 'INVALID_CODE', 'MFA_NOT_PENDING']),
      message: z.string(),
    }),
  }),
};

export type MfaVerifyEnrollmentRequest = z.infer<typeof mfaVerifyEnrollmentContract.requestSchema>;
export type MfaVerifyEnrollmentResponse = z.infer<typeof mfaVerifyEnrollmentContract.responseSchema>;
export type MfaVerifyEnrollmentError = z.infer<typeof mfaVerifyEnrollmentContract.errorSchema>;

// ============================================================================
// MFA CHALLENGE (During Login)
// ============================================================================

export const mfaChallengeContract = {
  method: 'POST' as const,
  path: '/api/auth/mfa/challenge',
  authRequired: false, // User is not yet fully authenticated
  rateLimitTier: 'public' as const,

  requestSchema: z.object({
    email: emailSchema,
    code: z.string().min(6).max(10), // TOTP (6 digits) or backup code (10 chars)
  }),

  responseSchema: z.object({
    data: z.object({
      user: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string(),
        role: z.enum(['SUPER_ADMIN', 'STORE_ADMIN', 'STAFF', 'CUSTOMER']),
        storeId: z.string().uuid().nullable(),
      }),
      token: z.string(),
      expiresAt: z.string().datetime(),
    }),
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['INVALID_CODE', 'CODE_EXPIRED', 'MAX_ATTEMPTS_EXCEEDED']),
      message: z.string(),
      attemptsRemaining: z.number().optional(),
    }),
  }),
};

export type MfaChallengeRequest = z.infer<typeof mfaChallengeContract.requestSchema>;
export type MfaChallengeResponse = z.infer<typeof mfaChallengeContract.responseSchema>;
export type MfaChallengeError = z.infer<typeof mfaChallengeContract.errorSchema>;

// ============================================================================
// MFA DISABLE
// ============================================================================

export const mfaDisableContract = {
  method: 'POST' as const,
  path: '/api/auth/mfa/disable',
  authRequired: true,
  rateLimitTier: 'authenticated' as const,

  requestSchema: z.object({
    password: z.string(), // Require password confirmation
    code: totpCodeSchema.optional(), // Optional verification code
  }),

  responseSchema: z.object({
    data: z.object({
      mfaEnabled: z.boolean(),
    }),
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['UNAUTHORIZED', 'INVALID_PASSWORD', 'INVALID_CODE']),
      message: z.string(),
    }),
  }),
};

export type MfaDisableRequest = z.infer<typeof mfaDisableContract.requestSchema>;
export type MfaDisableResponse = z.infer<typeof mfaDisableContract.responseSchema>;
export type MfaDisableError = z.infer<typeof mfaDisableContract.errorSchema>;

// ============================================================================
// PASSWORD RESET REQUEST
// ============================================================================

export const passwordResetRequestContract = {
  method: 'POST' as const,
  path: '/api/auth/password-reset/request',
  authRequired: false,
  rateLimitTier: 'public' as const,

  requestSchema: z.object({
    email: emailSchema,
  }),

  responseSchema: z.object({
    message: z.string(), // Always returns success message (even if email doesn't exist - security)
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['RATE_LIMIT_EXCEEDED']),
      message: z.string(),
    }),
  }),
};

export type PasswordResetRequestRequest = z.infer<typeof passwordResetRequestContract.requestSchema>;
export type PasswordResetRequestResponse = z.infer<typeof passwordResetRequestContract.responseSchema>;
export type PasswordResetRequestError = z.infer<typeof passwordResetRequestContract.errorSchema>;

// ============================================================================
// PASSWORD RESET CONFIRM
// ============================================================================

export const passwordResetConfirmContract = {
  method: 'POST' as const,
  path: '/api/auth/password-reset/confirm',
  authRequired: false,
  rateLimitTier: 'public' as const,

  requestSchema: z.object({
    token: z.string().uuid(), // Password reset token from email link
    newPassword: passwordSchema,
  }),

  responseSchema: z.object({
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['INVALID_TOKEN', 'TOKEN_EXPIRED', 'PASSWORD_REUSED']),
      message: z.string(),
    }),
  }),
};

export type PasswordResetConfirmRequest = z.infer<typeof passwordResetConfirmContract.requestSchema>;
export type PasswordResetConfirmResponse = z.infer<typeof passwordResetConfirmContract.responseSchema>;
export type PasswordResetConfirmError = z.infer<typeof passwordResetConfirmContract.errorSchema>;

// ============================================================================
// CHANGE PASSWORD (Authenticated)
// ============================================================================

export const changePasswordContract = {
  method: 'POST' as const,
  path: '/api/auth/change-password',
  authRequired: true,
  rateLimitTier: 'authenticated' as const,

  requestSchema: z.object({
    currentPassword: z.string(),
    newPassword: passwordSchema,
  }),

  responseSchema: z.object({
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['UNAUTHORIZED', 'INVALID_PASSWORD', 'PASSWORD_REUSED']),
      message: z.string(),
    }),
  }),
};

export type ChangePasswordRequest = z.infer<typeof changePasswordContract.requestSchema>;
export type ChangePasswordResponse = z.infer<typeof changePasswordContract.responseSchema>;
export type ChangePasswordError = z.infer<typeof changePasswordContract.errorSchema>;

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

export const verifyEmailContract = {
  method: 'POST' as const,
  path: '/api/auth/verify-email',
  authRequired: false,
  rateLimitTier: 'public' as const,

  requestSchema: z.object({
    token: z.string().uuid(), // Verification token from email link
  }),

  responseSchema: z.object({
    data: z.object({
      emailVerified: z.boolean(),
    }),
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['INVALID_TOKEN', 'TOKEN_EXPIRED', 'ALREADY_VERIFIED']),
      message: z.string(),
    }),
  }),
};

export type VerifyEmailRequest = z.infer<typeof verifyEmailContract.requestSchema>;
export type VerifyEmailResponse = z.infer<typeof verifyEmailContract.responseSchema>;
export type VerifyEmailError = z.infer<typeof verifyEmailContract.errorSchema>;

// ============================================================================
// RESEND EMAIL VERIFICATION
// ============================================================================

export const resendVerificationEmailContract = {
  method: 'POST' as const,
  path: '/api/auth/resend-verification',
  authRequired: true,
  rateLimitTier: 'authenticated' as const,

  requestSchema: z.object({}), // No body required

  responseSchema: z.object({
    message: z.string(),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['UNAUTHORIZED', 'ALREADY_VERIFIED', 'RATE_LIMIT_EXCEEDED']),
      message: z.string(),
    }),
  }),
};

export type ResendVerificationEmailRequest = z.infer<typeof resendVerificationEmailContract.requestSchema>;
export type ResendVerificationEmailResponse = z.infer<typeof resendVerificationEmailContract.responseSchema>;
export type ResendVerificationEmailError = z.infer<typeof resendVerificationEmailContract.errorSchema>;

// ============================================================================
// GET CURRENT USER (Session Check)
// ============================================================================

export const getCurrentUserContract = {
  method: 'GET' as const,
  path: '/api/auth/me',
  authRequired: true,
  rateLimitTier: 'authenticated' as const,

  requestSchema: z.object({}), // No body for GET

  responseSchema: z.object({
    data: z.object({
      user: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string(),
        role: z.enum(['SUPER_ADMIN', 'STORE_ADMIN', 'STAFF', 'CUSTOMER']),
        storeId: z.string().uuid().nullable(),
        emailVerified: z.boolean(),
        mfaEnabled: z.boolean(),
        lastLoginAt: z.string().datetime().nullable(),
      }),
      session: z.object({
        expiresAt: z.string().datetime(),
        lastActivityAt: z.string().datetime(),
      }),
    }),
  }),

  errorSchema: z.object({
    error: z.object({
      code: z.enum(['UNAUTHORIZED', 'SESSION_EXPIRED']),
      message: z.string(),
    }),
  }),
};

export type GetCurrentUserRequest = z.infer<typeof getCurrentUserContract.requestSchema>;
export type GetCurrentUserResponse = z.infer<typeof getCurrentUserContract.responseSchema>;
export type GetCurrentUserError = z.infer<typeof getCurrentUserContract.errorSchema>;
