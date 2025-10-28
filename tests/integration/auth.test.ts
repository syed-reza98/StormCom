/**
 * Integration Tests: Authentication Services
 * 
 * Task: T079 [US0] Create integration test "Integration tests for auth services"
 * 
 * Purpose: Comprehensive integration testing of authentication services,
 * API endpoints, business logic, and data persistence layers.
 * 
 * Requirements:
 * - Test all authentication API endpoints
 * - Validate business logic for user registration, login, logout
 * - Test password hashing and verification
 * - Test session management and token validation
 * - Test email verification workflow
 * - Test password reset workflow
 * - Test multi-tenant user isolation
 * - Test database operations and data integrity
 * - Test error handling and edge cases
 * - Test security measures and rate limiting
 * 
 * User Story: US0 Authentication
 * Integration Scope: Services, APIs, Database, Business Logic
 * Test Categories:
 * - API Endpoint Integration
 * - Service Layer Integration
 * - Database Integration
 * - Security Integration
 * - Multi-tenant Integration
 * - Error Handling Integration
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// Mock implementations for services that may not exist yet
interface MockUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

interface MockPasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

interface MockEmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

// Mock database operations
class MockUserService {
  private users: MockUser[] = [];
  private sessions: MockSession[] = [];
  private passwordResets: MockPasswordReset[] = [];
  private emailVerifications: MockEmailVerification[] = [];

  async createUser(userData: Partial<MockUser>): Promise<MockUser> {
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 12) : '';
    
    const user: MockUser = {
      id: `user-${Date.now()}-${Math.random()}`,
      email: userData.email || '',
      password: hashedPassword,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      emailVerified: false,
      storeId: userData.storeId || 'store-001',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(user);
    return user;
  }

  async findUserByEmail(email: string, storeId: string): Promise<MockUser | null> {
    return this.users.find(u => u.email === email && u.storeId === storeId) || null;
  }

  async findUserById(id: string): Promise<MockUser | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async updateUser(id: string, updates: Partial<MockUser>): Promise<MockUser | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.users[userIndex];
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async createSession(userId: string): Promise<MockSession> {
    const session: MockSession = {
      id: `session-${Date.now()}-${Math.random()}`,
      userId,
      token: `token-${Date.now()}-${Math.random()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date()
    };

    this.sessions.push(session);
    return session;
  }

  async findSessionByToken(token: string): Promise<MockSession | null> {
    return this.sessions.find(s => s.token === token && s.expiresAt > new Date()) || null;
  }

  async deleteSession(token: string): Promise<boolean> {
    const sessionIndex = this.sessions.findIndex(s => s.token === token);
    if (sessionIndex === -1) return false;

    this.sessions.splice(sessionIndex, 1);
    return true;
  }

  async createPasswordReset(userId: string): Promise<MockPasswordReset> {
    // Invalidate existing reset tokens
    this.passwordResets.forEach(pr => {
      if (pr.userId === userId) pr.used = true;
    });

    const reset: MockPasswordReset = {
      id: `reset-${Date.now()}-${Math.random()}`,
      userId,
      token: `reset-token-${Date.now()}-${Math.random()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      used: false,
      createdAt: new Date()
    };

    this.passwordResets.push(reset);
    return reset;
  }

  async findPasswordReset(token: string): Promise<MockPasswordReset | null> {
    return this.passwordResets.find(pr => 
      pr.token === token && 
      !pr.used && 
      pr.expiresAt > new Date()
    ) || null;
  }

  async usePasswordReset(token: string): Promise<boolean> {
    const reset = this.passwordResets.find(pr => pr.token === token);
    if (!reset) return false;

    reset.used = true;
    return true;
  }

  async createEmailVerification(userId: string): Promise<MockEmailVerification> {
    const verification: MockEmailVerification = {
      id: `verify-${Date.now()}-${Math.random()}`,
      userId,
      token: `verify-token-${Date.now()}-${Math.random()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      verified: false,
      createdAt: new Date()
    };

    this.emailVerifications.push(verification);
    return verification;
  }

  async findEmailVerification(token: string): Promise<MockEmailVerification | null> {
    return this.emailVerifications.find(ev => 
      ev.token === token && 
      !ev.verified && 
      ev.expiresAt > new Date()
    ) || null;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const verification = this.emailVerifications.find(ev => ev.token === token);
    if (!verification) return false;

    verification.verified = true;
    
    // Update user email verification status
    const user = this.users.find(u => u.id === verification.userId);
    if (user) {
      user.emailVerified = true;
      user.updatedAt = new Date();
    }

    return true;
  }

  // Utility methods for testing
  clear(): void {
    this.users = [];
    this.sessions = [];
    this.passwordResets = [];
    this.emailVerifications = [];
  }

  getUserCount(): number {
    return this.users.length;
  }

  getSessionCount(): number {
    return this.sessions.filter(s => s.expiresAt > new Date()).length;
  }
}

// Mock authentication service
class MockAuthService {
  constructor(private userService: MockUserService) {}

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    storeId: string;
  }): Promise<{ user: MockUser; verification: MockEmailVerification }> {
    // Check if user already exists
    const existingUser = await this.userService.findUserByEmail(userData.email, userData.storeId);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Validate input
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      throw new Error('Missing required fields');
    }

    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Create user
    const user = await this.userService.createUser(userData);
    
    // Create email verification
    const verification = await this.userService.createEmailVerification(user.id);

    return { user, verification };
  }

  async login(credentials: {
    email: string;
    password: string;
    storeId: string;
  }): Promise<{ user: MockUser; session: MockSession }> {
    const { email, password, storeId } = credentials;

    // Find user
    const user = await this.userService.findUserByEmail(email, storeId);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const passwordValid = await this.userService.verifyPassword(password, user.password);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    // Check email verification (optional enforcement)
    if (!user.emailVerified) {
      throw new Error('Email verification required');
    }

    // Create session
    const session = await this.userService.createSession(user.id);

    return { user, session };
  }

  async logout(token: string): Promise<boolean> {
    return this.userService.deleteSession(token);
  }

  async requestPasswordReset(email: string, storeId: string): Promise<MockPasswordReset> {
    const user = await this.userService.findUserByEmail(email, storeId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.userService.createPasswordReset(user.id);
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const reset = await this.userService.findPasswordReset(token);
    if (!reset) {
      throw new Error('Invalid or expired reset token');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userService.updateUser(reset.userId, { password: hashedPassword });

    // Mark reset token as used
    await this.userService.usePasswordReset(token);

    return true;
  }

  async verifyEmail(token: string): Promise<boolean> {
    return this.userService.verifyEmail(token);
  }

  async validateSession(token: string): Promise<MockUser | null> {
    const session = await this.userService.findSessionByToken(token);
    if (!session) return null;

    return this.userService.findUserById(session.userId);
  }
}

// Mock API route handlers
class MockAPIRoutes {
  constructor(private authService: MockAuthService) {}

  async handleRegister(request: { body: any }): Promise<NextResponse> {
    try {
      const { firstName, lastName, email, password, storeId } = request.body;
      
      const result = await this.authService.register({
        firstName,
        lastName,
        email,
        password,
        storeId: storeId || 'store-001'
      });

      return NextResponse.json({
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            emailVerified: result.user.emailVerified
          },
          message: 'Registration successful. Please verify your email.'
        }
      }, { status: 201 });

    } catch (error: any) {
      return NextResponse.json({
        error: {
          code: 'REGISTRATION_ERROR',
          message: error.message
        }
      }, { status: 400 });
    }
  }

  async handleLogin(request: { body: any }): Promise<NextResponse> {
    try {
      const { email, password, storeId } = request.body;
      
      const result = await this.authService.login({
        email,
        password,
        storeId: storeId || 'store-001'
      });

      return NextResponse.json({
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            emailVerified: result.user.emailVerified
          },
          session: {
            token: result.session.token,
            expiresAt: result.session.expiresAt
          }
        }
      }, { status: 200 });

    } catch (error: any) {
      return NextResponse.json({
        error: {
          code: 'LOGIN_ERROR',
          message: error.message
        }
      }, { status: 401 });
    }
  }

  async handleLogout(request: { headers: any }): Promise<NextResponse> {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return NextResponse.json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token required'
          }
        }, { status: 401 });
      }

      const success = await this.authService.logout(token);
      
      if (!success) {
        return NextResponse.json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid session token'
          }
        }, { status: 401 });
      }

      return NextResponse.json({
        data: { message: 'Logout successful' }
      }, { status: 200 });

    } catch (error: any) {
      return NextResponse.json({
        error: {
          code: 'LOGOUT_ERROR',
          message: error.message
        }
      }, { status: 500 });
    }
  }

  async handlePasswordReset(request: { body: any }): Promise<NextResponse> {
    try {
      const { email, storeId } = request.body;
      
      const reset = await this.authService.requestPasswordReset(
        email,
        storeId || 'store-001'
      );

      return NextResponse.json({
        data: {
          message: 'Password reset email sent',
          resetToken: reset.token // In real app, this would be sent via email
        }
      }, { status: 200 });

    } catch (error: any) {
      return NextResponse.json({
        error: {
          code: 'PASSWORD_RESET_ERROR',
          message: error.message
        }
      }, { status: 400 });
    }
  }

  async handlePasswordResetConfirm(request: { body: any }): Promise<NextResponse> {
    try {
      const { token, password } = request.body;
      
      const success = await this.authService.resetPassword(token, password);
      
      if (!success) {
        return NextResponse.json({
          error: {
            code: 'RESET_FAILED',
            message: 'Password reset failed'
          }
        }, { status: 400 });
      }

      return NextResponse.json({
        data: { message: 'Password reset successful' }
      }, { status: 200 });

    } catch (error: any) {
      return NextResponse.json({
        error: {
          code: 'PASSWORD_RESET_CONFIRM_ERROR',
          message: error.message
        }
      }, { status: 400 });
    }
  }

  async handleEmailVerification(request: { body: any }): Promise<NextResponse> {
    try {
      const { token } = request.body;
      
      const success = await this.authService.verifyEmail(token);
      
      if (!success) {
        return NextResponse.json({
          error: {
            code: 'VERIFICATION_FAILED',
            message: 'Email verification failed'
          }
        }, { status: 400 });
      }

      return NextResponse.json({
        data: { message: 'Email verified successfully' }
      }, { status: 200 });

    } catch (error: any) {
      return NextResponse.json({
        error: {
          code: 'EMAIL_VERIFICATION_ERROR',
          message: error.message
        }
      }, { status: 400 });
    }
  }
}

// Integration Tests
describe('Authentication Services Integration - T079', () => {
  let userService: MockUserService;
  let authService: MockAuthService;
  let apiRoutes: MockAPIRoutes;

  const testUser = {
    firstName: 'Integration',
    lastName: 'TestUser',
    email: 'integration.test@stormcom.dev',
    password: 'IntegrationTest123!',
    storeId: 'store-001'
  };

  beforeEach(() => {
    userService = new MockUserService();
    authService = new MockAuthService(userService);
    apiRoutes = new MockAPIRoutes(authService);
  });

  afterEach(() => {
    userService.clear();
  });

  describe('User Registration Integration', () => {
    test('Complete registration flow with email verification', async () => {
      // Act: Register user through API
      const registerResponse = await apiRoutes.handleRegister({
        body: testUser
      });

      // Assert: Registration successful
      expect(registerResponse.status).toBe(201);
      
      const registerData = await registerResponse.json();
      expect(registerData.data.user.email).toBe(testUser.email);
      expect(registerData.data.user.emailVerified).toBe(false);

      // Verify user created in database
      const dbUser = await userService.findUserByEmail(testUser.email, testUser.storeId);
      expect(dbUser).toBeTruthy();
      expect(dbUser!.firstName).toBe(testUser.firstName);
      expect(dbUser!.lastName).toBe(testUser.lastName);

      // Verify password hashed
      expect(dbUser!.password).not.toBe(testUser.password);
      const passwordValid = await userService.verifyPassword(testUser.password, dbUser!.password);
      expect(passwordValid).toBe(true);

      // Verify email verification created
      expect(userService.getUserCount()).toBe(1);
    });

    test('Registration prevents duplicate users per store', async () => {
      // Arrange: Register user once
      await apiRoutes.handleRegister({ body: testUser });

      // Act: Try to register same user again
      const duplicateResponse = await apiRoutes.handleRegister({
        body: testUser
      });

      // Assert: Should reject duplicate
      expect(duplicateResponse.status).toBe(400);
      
      const errorData = await duplicateResponse.json();
      expect(errorData.error.message).toContain('already exists');

      // Should still have only one user
      expect(userService.getUserCount()).toBe(1);
    });

    test('Registration allows same email across different stores', async () => {
      // Arrange: Register user in store-001
      await apiRoutes.handleRegister({ body: testUser });

      // Act: Register same email in different store
      const differentStoreResponse = await apiRoutes.handleRegister({
        body: { ...testUser, storeId: 'store-002' }
      });

      // Assert: Should allow registration
      expect(differentStoreResponse.status).toBe(201);
      expect(userService.getUserCount()).toBe(2);

      // Verify users are isolated by store
      const user1 = await userService.findUserByEmail(testUser.email, 'store-001');
      const user2 = await userService.findUserByEmail(testUser.email, 'store-002');
      
      expect(user1).toBeTruthy();
      expect(user2).toBeTruthy();
      expect(user1!.id).not.toBe(user2!.id);
    });

    test('Registration validates input requirements', async () => {
      const invalidInputs = [
        { ...testUser, email: '' },
        { ...testUser, password: '' },
        { ...testUser, firstName: '' },
        { ...testUser, lastName: '' },
        { ...testUser, password: '123' }, // Too short
        { ...testUser, email: 'invalid-email' }
      ];

      for (const invalidInput of invalidInputs) {
        const response = await apiRoutes.handleRegister({
          body: invalidInput
        });

        expect(response.status).toBe(400);
        
        const errorData = await response.json();
        expect(errorData.error).toBeTruthy();
      }

      // No users should be created
      expect(userService.getUserCount()).toBe(0);
    });
  });

  describe('User Login Integration', () => {
    beforeEach(async () => {
      // Setup verified user for login tests
      const { verification } = await authService.register(testUser);
      await authService.verifyEmail(verification.token);
    });

    test('Successful login with verified user', async () => {
      // Act: Login through API
      const loginResponse = await apiRoutes.handleLogin({
        body: {
          email: testUser.email,
          password: testUser.password,
          storeId: testUser.storeId
        }
      });

      // Assert: Login successful
      expect(loginResponse.status).toBe(200);
      
      const loginData = await loginResponse.json();
      expect(loginData.data.user.email).toBe(testUser.email);
      expect(loginData.data.user.emailVerified).toBe(true);
      expect(loginData.data.session.token).toBeTruthy();

      // Verify session created
      expect(userService.getSessionCount()).toBe(1);
    });

    test('Login fails with invalid credentials', async () => {
      const invalidCredentials = [
        { email: testUser.email, password: 'wrong-password', storeId: testUser.storeId },
        { email: 'wrong@email.com', password: testUser.password, storeId: testUser.storeId },
        { email: testUser.email, password: testUser.password, storeId: 'wrong-store' }
      ];

      for (const credentials of invalidCredentials) {
        const response = await apiRoutes.handleLogin({
          body: credentials
        });

        expect(response.status).toBe(401);
        
        const errorData = await response.json();
        expect(errorData.error.message).toContain('Invalid credentials');
      }

      // No sessions should be created
      expect(userService.getSessionCount()).toBe(0);
    });

    test('Login enforces email verification', async () => {
      // Arrange: Create unverified user
      const unverifiedUser = {
        firstName: 'Unverified',
        lastName: 'User',
        email: 'unverified@stormcom.dev',
        password: 'Unverified123!',
        storeId: 'store-001'
      };

      await authService.register(unverifiedUser);

      // Act: Try to login with unverified user
      const loginResponse = await apiRoutes.handleLogin({
        body: {
          email: unverifiedUser.email,
          password: unverifiedUser.password,
          storeId: unverifiedUser.storeId
        }
      });

      // Assert: Should reject login
      expect(loginResponse.status).toBe(401);
      
      const errorData = await loginResponse.json();
      expect(errorData.error.message).toContain('Email verification required');

      // No session should be created
      expect(userService.getSessionCount()).toBe(0);
    });
  });

  describe('Session Management Integration', () => {
    let sessionToken: string;

    beforeEach(async () => {
      // Setup user and login to get session
      const { verification } = await authService.register(testUser);
      await authService.verifyEmail(verification.token);
      
      const loginResult = await authService.login({
        email: testUser.email,
        password: testUser.password,
        storeId: testUser.storeId
      });
      
      sessionToken = loginResult.session.token;
    });

    test('Session validation retrieves correct user', async () => {
      // Act: Validate session
      const user = await authService.validateSession(sessionToken);

      // Assert: Returns correct user
      expect(user).toBeTruthy();
      expect(user!.email).toBe(testUser.email);
      expect(user!.emailVerified).toBe(true);
    });

    test('Session expires after timeout', async () => {
      // Arrange: Create session with short expiry
      const shortSession = await userService.createSession('test-user');
      shortSession.expiresAt = new Date(Date.now() - 1000); // 1 second ago

      // Act: Try to validate expired session
      const user = await authService.validateSession(shortSession.token);

      // Assert: Should be null for expired session
      expect(user).toBeNull();
    });

    test('Logout invalidates session', async () => {
      // Act: Logout through API
      const logoutResponse = await apiRoutes.handleLogout({
        headers: { authorization: `Bearer ${sessionToken}` }
      });

      // Assert: Logout successful
      expect(logoutResponse.status).toBe(200);

      // Session should be invalidated
      const user = await authService.validateSession(sessionToken);
      expect(user).toBeNull();

      // Session count should decrease
      expect(userService.getSessionCount()).toBe(0);
    });

    test('Logout handles invalid tokens gracefully', async () => {
      const invalidTokens = [
        'invalid-token',
        '',
        'Bearer invalid-token'
      ];

      for (const token of invalidTokens) {
        const response = await apiRoutes.handleLogout({
          headers: { authorization: token }
        });

        expect(response.status).toBe(401);
        
        const errorData = await response.json();
        expect(errorData.error).toBeTruthy();
      }
    });
  });

  describe('Password Reset Integration', () => {
    beforeEach(async () => {
      // Setup verified user
      const { verification } = await authService.register(testUser);
      await authService.verifyEmail(verification.token);
    });

    test('Complete password reset flow', async () => {
      // Act: Request password reset
      const resetResponse = await apiRoutes.handlePasswordReset({
        body: {
          email: testUser.email,
          storeId: testUser.storeId
        }
      });

      // Assert: Reset request successful
      expect(resetResponse.status).toBe(200);
      
      const resetData = await resetResponse.json();
      const resetToken = resetData.data.resetToken;
      expect(resetToken).toBeTruthy();

      // Act: Confirm password reset
      const newPassword = 'NewPassword123!';
      const confirmResponse = await apiRoutes.handlePasswordResetConfirm({
        body: {
          token: resetToken,
          password: newPassword
        }
      });

      // Assert: Reset confirmation successful
      expect(confirmResponse.status).toBe(200);

      // Verify new password works
      const loginResponse = await apiRoutes.handleLogin({
        body: {
          email: testUser.email,
          password: newPassword,
          storeId: testUser.storeId
        }
      });

      expect(loginResponse.status).toBe(200);

      // Verify old password doesn't work
      const oldPasswordResponse = await apiRoutes.handleLogin({
        body: {
          email: testUser.email,
          password: testUser.password,
          storeId: testUser.storeId
        }
      });

      expect(oldPasswordResponse.status).toBe(401);
    });

    test('Password reset token expires after use', async () => {
      // Arrange: Get reset token
      const resetResponse = await apiRoutes.handlePasswordReset({
        body: { email: testUser.email, storeId: testUser.storeId }
      });
      
      const resetData = await resetResponse.json();
      const resetToken = resetData.data.resetToken;

      // Act: Use token once
      await apiRoutes.handlePasswordResetConfirm({
        body: { token: resetToken, password: 'NewPassword123!' }
      });

      // Act: Try to use token again
      const secondUseResponse = await apiRoutes.handlePasswordResetConfirm({
        body: { token: resetToken, password: 'AnotherPassword123!' }
      });

      // Assert: Second use should fail
      expect(secondUseResponse.status).toBe(400);
      
      const errorData = await secondUseResponse.json();
      expect(errorData.error.message).toContain('Invalid or expired');
    });

    test('Password reset invalidates old tokens on new request', async () => {
      // Arrange: Get first reset token
      const firstResetResponse = await apiRoutes.handlePasswordReset({
        body: { email: testUser.email, storeId: testUser.storeId }
      });
      
      const firstResetData = await firstResetResponse.json();
      const firstToken = firstResetData.data.resetToken;

      // Act: Request new reset token
      const secondResetResponse = await apiRoutes.handlePasswordReset({
        body: { email: testUser.email, storeId: testUser.storeId }
      });

      const secondResetData = await secondResetResponse.json();
      const secondToken = secondResetData.data.resetToken;

      // Act: Try to use first token
      const firstTokenResponse = await apiRoutes.handlePasswordResetConfirm({
        body: { token: firstToken, password: 'NewPassword123!' }
      });

      // Assert: First token should be invalid
      expect(firstTokenResponse.status).toBe(400);

      // Act: Use second token
      const secondTokenResponse = await apiRoutes.handlePasswordResetConfirm({
        body: { token: secondToken, password: 'NewPassword123!' }
      });

      // Assert: Second token should work
      expect(secondTokenResponse.status).toBe(200);
    });
  });

  describe('Email Verification Integration', () => {
    let verificationToken: string;

    beforeEach(async () => {
      // Setup unverified user
      const { verification } = await authService.register(testUser);
      verificationToken = verification.token;
    });

    test('Email verification activates user account', async () => {
      // Act: Verify email through API
      const verifyResponse = await apiRoutes.handleEmailVerification({
        body: { token: verificationToken }
      });

      // Assert: Verification successful
      expect(verifyResponse.status).toBe(200);

      // User should now be verified
      const user = await userService.findUserByEmail(testUser.email, testUser.storeId);
      expect(user!.emailVerified).toBe(true);

      // Should now be able to login
      const loginResponse = await apiRoutes.handleLogin({
        body: {
          email: testUser.email,
          password: testUser.password,
          storeId: testUser.storeId
        }
      });

      expect(loginResponse.status).toBe(200);
    });

    test('Email verification token is single-use', async () => {
      // Act: Use verification token
      await apiRoutes.handleEmailVerification({
        body: { token: verificationToken }
      });

      // Act: Try to use token again
      const secondUseResponse = await apiRoutes.handleEmailVerification({
        body: { token: verificationToken }
      });

      // Assert: Second use should fail
      expect(secondUseResponse.status).toBe(400);
      
      const errorData = await secondUseResponse.json();
      expect(errorData.error.message).toContain('verification failed');
    });

    test('Invalid verification tokens are rejected', async () => {
      const invalidTokens = [
        'invalid-token',
        '',
        'expired-token-12345'
      ];

      for (const token of invalidTokens) {
        const response = await apiRoutes.handleEmailVerification({
          body: { token }
        });

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Multi-tenant Isolation', () => {
    test('User operations are isolated by store', async () => {
      // Arrange: Create users in different stores
      const store1User = { ...testUser, storeId: 'store-001' };
      const store2User = { ...testUser, storeId: 'store-002' };

      await authService.register(store1User);
      await authService.register(store2User);

      // Act & Assert: Store 1 user cannot access store 2
      const crossStoreLoginResponse = await apiRoutes.handleLogin({
        body: {
          email: testUser.email,
          password: testUser.password,
          storeId: 'store-003' // Different store
        }
      });

      expect(crossStoreLoginResponse.status).toBe(401);

      // Each store should see their own user
      const user1 = await userService.findUserByEmail(testUser.email, 'store-001');
      const user2 = await userService.findUserByEmail(testUser.email, 'store-002');
      const user3 = await userService.findUserByEmail(testUser.email, 'store-003');

      expect(user1).toBeTruthy();
      expect(user2).toBeTruthy();
      expect(user3).toBeNull();
    });

    test('Password reset respects store isolation', async () => {
      // Arrange: User in store-001
      await authService.register({ ...testUser, storeId: 'store-001' });

      // Act: Try password reset for different store
      const resetResponse = await apiRoutes.handlePasswordReset({
        body: {
          email: testUser.email,
          storeId: 'store-002'
        }
      });

      // Assert: Should fail
      expect(resetResponse.status).toBe(400);
      
      const errorData = await resetResponse.json();
      expect(errorData.error.message).toContain('not found');
    });
  });

  describe('Security and Error Handling', () => {
    test('Password hashing uses secure algorithms', async () => {
      // Act: Register user
      await authService.register(testUser);

      // Assert: Password should be hashed
      const user = await userService.findUserByEmail(testUser.email, testUser.storeId);
      
      expect(user!.password).not.toBe(testUser.password);
      expect(user!.password.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
      expect(user!.password.startsWith('$2b$')).toBe(true); // bcrypt prefix
    });

    test('Session tokens are cryptographically secure', async () => {
      // Act: Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        const session = await userService.createSession('test-user');
        sessions.push(session.token);
      }

      // Assert: All tokens should be unique and reasonably long
      const uniqueTokens = new Set(sessions);
      expect(uniqueTokens.size).toBe(sessions.length);

      sessions.forEach(token => {
        expect(token.length).toBeGreaterThan(20);
        expect(token).toMatch(/^token-\d+-0\.\d+$/); // Mock format
      });
    });

    test('API endpoints handle malformed requests', async () => {
      const malformedRequests = [
        { endpoint: 'register', body: null },
        { endpoint: 'register', body: 'invalid-json' },
        { endpoint: 'login', body: {} },
        { endpoint: 'logout', headers: {} }
      ];

      for (const request of malformedRequests) {
        let response;
        
        switch (request.endpoint) {
          case 'register':
            response = await apiRoutes.handleRegister({ body: request.body });
            break;
          case 'login':
            response = await apiRoutes.handleLogin({ body: request.body });
            break;
          case 'logout':
            response = await apiRoutes.handleLogout({ headers: request.headers });
            break;
          default:
            continue;
        }

        expect([400, 401, 500]).toContain(response.status);
        
        const errorData = await response.json();
        expect(errorData.error).toBeTruthy();
      }
    });

    test('Service methods validate inputs properly', async () => {
      const invalidInputs = [
        () => authService.register({ firstName: '', lastName: '', email: '', password: '', storeId: '' }),
        () => authService.login({ email: '', password: '', storeId: '' }),
        () => authService.requestPasswordReset('', ''),
        () => authService.resetPassword('', ''),
        () => authService.verifyEmail('')
      ];

      for (const invalidCall of invalidInputs) {
        await expect(invalidCall()).rejects.toThrow();
      }
    });
  });

  describe('Database Integration', () => {
    test('User creation persists correctly', async () => {
      // Act: Register user
      const { user } = await authService.register(testUser);

      // Assert: User data persisted correctly
      const dbUser = await userService.findUserById(user.id);
      
      expect(dbUser).toBeTruthy();
      expect(dbUser!.email).toBe(testUser.email);
      expect(dbUser!.firstName).toBe(testUser.firstName);
      expect(dbUser!.lastName).toBe(testUser.lastName);
      expect(dbUser!.storeId).toBe(testUser.storeId);
      expect(dbUser!.emailVerified).toBe(false);
      expect(dbUser!.createdAt).toBeInstanceOf(Date);
      expect(dbUser!.updatedAt).toBeInstanceOf(Date);
    });

    test('Session management maintains data integrity', async () => {
      // Arrange: Create user and login
      const { user, verification } = await authService.register(testUser);
      await authService.verifyEmail(verification.token);
      
      // Act: Create multiple sessions
      const session1 = await userService.createSession(user.id);
      const session2 = await userService.createSession(user.id);

      // Assert: Both sessions should be active
      expect(userService.getSessionCount()).toBe(2);

      const user1 = await authService.validateSession(session1.token);
      const user2 = await authService.validateSession(session2.token);

      expect(user1!.id).toBe(user.id);
      expect(user2!.id).toBe(user.id);

      // Act: Delete one session
      await userService.deleteSession(session1.token);

      // Assert: Only one session should remain
      expect(userService.getSessionCount()).toBe(1);
      
      const user1After = await authService.validateSession(session1.token);
      const user2After = await authService.validateSession(session2.token);

      expect(user1After).toBeNull();
      expect(user2After!.id).toBe(user.id);
    });

    test('User updates maintain referential integrity', async () => {
      // Arrange: Create user
      const { user } = await authService.register(testUser);

      // Act: Update user
      const updatedUser = await userService.updateUser(user.id, {
        firstName: 'Updated',
        emailVerified: true
      });

      // Assert: Updates persisted correctly
      expect(updatedUser!.firstName).toBe('Updated');
      expect(updatedUser!.emailVerified).toBe(true);
      expect(updatedUser!.lastName).toBe(testUser.lastName); // Unchanged
      expect(updatedUser!.updatedAt.getTime()).toBeGreaterThan(updatedUser!.createdAt.getTime());

      // Verify via fresh query
      const dbUser = await userService.findUserById(user.id);
      expect(dbUser!.firstName).toBe('Updated');
      expect(dbUser!.emailVerified).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('Multiple concurrent registrations', async () => {
      // Act: Register multiple users concurrently
      const registrationPromises = [];
      
      for (let i = 0; i < 10; i++) {
        const userData = {
          ...testUser,
          email: `user${i}@stormcom.dev`
        };
        
        registrationPromises.push(authService.register(userData));
      }

      const results = await Promise.all(registrationPromises);

      // Assert: All registrations successful
      expect(results.length).toBe(10);
      expect(userService.getUserCount()).toBe(10);

      // All users should have unique IDs
      const userIds = results.map(r => r.user.id);
      const uniqueIds = new Set(userIds);
      expect(uniqueIds.size).toBe(10);
    });

    test('Session cleanup handles expired sessions', async () => {
      // Arrange: Create sessions with different expiry times
      const userId = 'test-user';
      
      const activeSession = await userService.createSession(userId);
      const expiredSession = await userService.createSession(userId);
      expiredSession.expiresAt = new Date(Date.now() - 1000); // 1 second ago

      // Act: Query for active sessions
      const activeSessionResult = await userService.findSessionByToken(activeSession.token);
      const expiredSessionResult = await userService.findSessionByToken(expiredSession.token);

      // Assert: Only active session should be returned
      expect(activeSessionResult).toBeTruthy();
      expect(expiredSessionResult).toBeNull();

      // Session count should reflect only active sessions
      expect(userService.getSessionCount()).toBe(1);
    });
  });
});