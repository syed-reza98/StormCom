/**
 * Role-Based Access Control (RBAC) Permission System
 * 
 * Defines route permissions for each user role and provides utilities
 * for checking access control throughout the application.
 * 
 * Security Requirements:
 * - SUPER_ADMIN: Full access to all routes (cross-tenant)
 * - STORE_ADMIN: Full access to own store routes, no access to /admin
 * - STAFF: Limited access to read-only store routes (products, orders, customers)
 * - CUSTOMER: Storefront access only (/shop, /account), no dashboard access
 */

/**
 * Route permission mappings for each user role
 * 
 * Patterns:
 * - '*' = All routes (SUPER_ADMIN only)
 * - '/path/*' = All routes under /path
 * - '/path' = Exact path only
 */
export const ROLE_PERMISSIONS = {
  // SUPER_ADMIN: Full system access (cross-tenant)
  SUPER_ADMIN: [
    '*', // All routes accessible
  ],

  // STORE_ADMIN: Full store management access (tenant-scoped)
  STORE_ADMIN: [
    // Dashboard routes
    '/dashboard',
    '/dashboard/*',
    
    // Product management
    '/products',
    '/products/*',
    '/categories',
    '/categories/*',
    '/attributes',
    '/attributes/*',
    '/brands',
    '/brands/*',
    
    // Inventory management
    '/inventory',
    '/inventory/*',
    
    // Order management
    '/orders',
    '/orders/*',
    
    // Customer management
    '/customers',
    '/customers/*',
    
    // Marketing
    '/marketing',
    '/marketing/*',
    '/coupons',
    '/coupons/*',
    
    // Content management
    '/pages',
    '/pages/*',
    '/blog',
    '/blog/*',
    
    // Point of Sale
    '/pos',
    '/pos/*',
    
    // Analytics and Reports
    '/analytics',
    '/analytics/*',
    '/reports',
    '/reports/*',
    
    // Store settings (own store only)
    '/settings',
    '/settings/*',
    
    // Import/Export
    '/bulk-import',
    '/bulk-import/*',
    
    // Store management (own store only - NOT /stores list)
    '/stores/[id]', // View own store details
    '/stores/[id]/edit', // Edit own store
  ],

  // STAFF: Limited read-only access (tenant-scoped)
  STAFF: [
    // Dashboard home
    '/dashboard',
    
    // Product viewing (read-only)
    '/products',
    '/products/[id]', // View product details
    '/categories',
    '/brands',
    
    // Inventory viewing (read-only)
    '/inventory',
    
    // Order management (process orders)
    '/orders',
    '/orders/*',
    
    // Customer management (view and assist)
    '/customers',
    '/customers/*',
    
    // Point of Sale (if assigned POS role)
    '/pos',
    '/pos/*',
  ],

  // CUSTOMER: Storefront access only
  CUSTOMER: [
    // Public storefront
    '/',
    '/shop',
    '/shop/*',
    
    // Customer account
    '/account',
    '/account/*',
    
    // Customer orders (own orders only)
    '/account/orders',
    '/account/orders/*',
    
    // Wishlist
    '/account/wishlist',
    
    // Addresses
    '/account/addresses',
    '/account/addresses/*',
    
    // Cart and checkout
    '/cart',
    '/checkout',
    '/checkout/*',
    
    // Product catalog (customer view)
    '/products/[slug]', // View product details (storefront)
    '/categories/[slug]', // Browse category (storefront)
    
    // Content pages
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/refunds',
    '/shipping',
  ],
} as const;

/**
 * Default redirect paths for each role after successful login
 */
export const ROLE_DEFAULT_REDIRECTS = {
  SUPER_ADMIN: '/dashboard',
  STORE_ADMIN: '/products',
  STAFF: '/products',
  CUSTOMER: '/',
} as const;

/**
 * Routes that are always public (no authentication required)
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/shop',
  '/shop/*',
  '/products/[slug]', // Public product view
  '/categories/[slug]', // Public category view
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/refunds',
  '/shipping',
  '/api/auth/*', // NextAuth routes
  '/api/webhooks/*', // Webhook endpoints
] as const;

/**
 * Check if a path matches a pattern
 * 
 * Patterns:
 * - '*' = Match all paths
 * - '/path/*' = Match /path and all subpaths
 * - '/path/[param]' = Match /path with any single segment
 * - '/path' = Exact match only
 * 
 * @param pathname - The path to check (e.g., '/products/123')
 * @param pattern - The pattern to match against (e.g., '/products/*')
 * @returns true if path matches pattern
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  // Wildcard: match all paths
  if (pattern === '*') {
    return true;
  }

  // Exact match
  if (pattern === pathname) {
    return true;
  }

  // Wildcard suffix: /path/* matches /path and /path/anything
  if (pattern.endsWith('/*')) {
    const basePattern = pattern.slice(0, -2); // Remove /*
    return pathname === basePattern || pathname.startsWith(`${basePattern}/`);
  }

  // Dynamic segment: /path/[param] matches /path/anything (single segment only)
  if (pattern.includes('[') && pattern.includes(']')) {
    const regexPattern = pattern
      .replace(/\[([^\]]+)\]/g, '([^/]+)') // [param] -> ([^/]+)
      .replace(/\*/g, '.*'); // * -> .*
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathname);
  }

  return false;
}

/**
 * Check if a user role can access a specific route
 * 
 * @param pathname - The path to check (e.g., '/products/123')
 * @param userRole - The user's role (e.g., 'STAFF')
 * @returns true if user has access to the route
 * 
 * @example
 * canAccess('/products', 'STAFF') // true
 * canAccess('/settings', 'STAFF') // false
 * canAccess('/admin', 'STORE_ADMIN') // false
 * canAccess('/products', 'CUSTOMER') // false
 */
export function canAccess(pathname: string, userRole?: string | null): boolean {
  // No role = unauthenticated user, check public routes only
  if (!userRole) {
    return PUBLIC_ROUTES.some((pattern) => matchesPattern(pathname, pattern));
  }

  // Check role-specific permissions
  const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  
  if (!permissions) {
    // Unknown role = deny access
    return false;
  }

  // Check if any permission pattern matches the pathname
  return permissions.some((pattern) => matchesPattern(pathname, pattern));
}

/**
 * Check if a route is public (no authentication required)
 * 
 * @param pathname - The path to check
 * @returns true if route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((pattern) => matchesPattern(pathname, pattern));
}

/**
 * Get the default redirect path for a user role after login
 * 
 * @param userRole - The user's role
 * @returns The default redirect path for the role
 */
export function getDefaultRedirect(userRole?: string | null): string {
  if (!userRole) {
    return '/';
  }

  return ROLE_DEFAULT_REDIRECTS[userRole as keyof typeof ROLE_DEFAULT_REDIRECTS] || '/';
}

/**
 * Check if a user has permission to perform an action on a resource
 * 
 * This is for fine-grained permissions within routes (e.g., edit vs view)
 * Currently simplified - extend as needed for action-level permissions
 * 
 * @param userRole - The user's role
 * @param action - The action (e.g., 'create', 'read', 'update', 'delete')
 * @param resource - The resource (e.g., 'product', 'order', 'customer')
 * @returns true if user can perform the action
 */
export function canPerformAction(
  userRole: string,
  action: 'create' | 'read' | 'update' | 'delete',
  resource: string
): boolean {
  // SUPER_ADMIN can do anything
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // STORE_ADMIN can do anything within their store
  if (userRole === 'STORE_ADMIN') {
    return true;
  }

  // STAFF has limited write permissions
  if (userRole === 'STAFF') {
    // Staff can read most things
    if (action === 'read') {
      return true;
    }

    // Staff can update orders (order processing)
    if (action === 'update' && resource === 'order') {
      return true;
    }

    // Staff can update customers (customer service)
    if (action === 'update' && resource === 'customer') {
      return true;
    }

    // No other write permissions
    return false;
  }

  // CUSTOMER can only manage their own data
  if (userRole === 'CUSTOMER') {
    // Customers can read public data
    if (action === 'read' && ['product', 'category', 'brand'].includes(resource)) {
      return true;
    }

    // Customers can manage their own orders, addresses, wishlist
    if (['order', 'address', 'wishlist'].includes(resource)) {
      return true; // Note: Must also check ownership in the actual route
    }

    return false;
  }

  // Unknown role = deny
  return false;
}
