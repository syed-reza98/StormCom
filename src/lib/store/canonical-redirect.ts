/**
 * Canonical Domain Redirect for Storefront
 * 
 * Redirects subdomain requests to primary custom domain (if configured).
 * Use this in storefront layout to enforce canonical URLs.
 * 
 * Example:
 * - User visits: demo-store.stormcom.app/products
 * - Redirects to: shop.example.com/products (if primary domain is set)
 * 
 * SEO Benefits:
 * - Prevents duplicate content issues
 * - Consolidates domain authority
 * - Maintains consistent branding
 * 
 * @module canonical-redirect
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getResolvedStore } from './resolve-from-headers';

/**
 * Check for canonical redirect and redirect if needed
 * Call this at the top of storefront layout or page Server Components
 * 
 * @param currentPath - Current request path (from pathname)
 * @returns void (redirects if needed, otherwise continues)
 */
export async function checkCanonicalRedirect(currentPath: string): Promise<void> {
  try {
    const resolved = await getResolvedStore();
    
    // If canonical redirect is needed, perform 301 redirect
    if (resolved.needsCanonicalRedirect && resolved.primaryDomain) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const canonicalUrl = `${protocol}://${resolved.primaryDomain}${currentPath}`;
      
      // 301 Permanent Redirect for SEO
      redirect(canonicalUrl);
    }
  } catch (error) {
    // Non-critical - log and continue if resolution fails
    console.error('[CANONICAL] Redirect check failed:', error);
  }
}

/**
 * Get canonical URL for current request (for meta tags)
 * Use this in metadata generation for rel="canonical" links
 * 
 * @param currentPath - Current request path
 * @returns Canonical URL or current URL if no primary domain
 */
export async function getCanonicalUrl(currentPath: string): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
    const resolved = await getResolvedStore();
    
    if (resolved.primaryDomain) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      return `${protocol}://${resolved.primaryDomain}${currentPath}`;
    }
    
    // Fallback to current host
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    return `${protocol}://${host}${currentPath}`;
  } catch (error) {
    console.error('[CANONICAL] URL generation failed:', error);
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    return `${protocol}://${host}${currentPath}`;
  }
}
