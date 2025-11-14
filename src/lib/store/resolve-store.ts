/**
 * Store Resolution from Domain/Subdomain
 * 
 * Maps incoming request host to store ID for multi-tenant isolation.
 * Supports:
 * - Custom domains (e.g., shop.example.com)
 * - Subdomains (e.g., my-store.stormcom.app)
 * - Canonical domain redirect (subdomain → primary custom domain)
 * 
 * @module store-resolver
 */

import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';

/**
 * Store resolution result
 */
export interface ResolvedStore {
  /** Store ID for multi-tenant context */
  storeId: string;
  /** Store slug (used in subdomains) */
  slug: string;
  /** Primary custom domain (if set) */
  primaryDomain?: string;
  /** Whether current request is on subdomain */
  isSubdomain: boolean;
  /** Whether redirect to canonical domain is needed */
  needsCanonicalRedirect: boolean;
}

/**
 * Extract subdomain from host
 * Returns null if not a subdomain or is primary domain
 * 
 * @param host - Request host (e.g., "my-store.stormcom.app")
 * @param baseDomain - Base platform domain (e.g., "stormcom.app")
 * @returns Subdomain slug or null
 */
export function extractSubdomain(host: string, baseDomain: string): string | null {
  // Remove port if present
  const cleanHost = host.split(':')[0];
  
  // Check if host ends with base domain
  if (!cleanHost.endsWith(`.${baseDomain}`)) {
    return null;
  }
  
  // Extract subdomain
  const subdomain = cleanHost.substring(0, cleanHost.length - baseDomain.length - 1);
  
  // Ignore www and empty subdomains
  if (!subdomain || subdomain === 'www') {
    return null;
  }
  
  return subdomain;
}

/**
 * Resolve store from request host
 * 
 * Resolution priority:
 * 1. Custom domain lookup (StoreDomain table)
 * 2. Subdomain extraction + Store.slug lookup
 * 3. 404 if no match
 * 
 * @param host - Request host from headers
 * @param baseDomain - Platform base domain (default: from env)
 * @returns Resolved store information
 * @throws NotFoundError if store not found for host
 */
export async function resolveStore(
  host: string,
  baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'stormcom.app'
): Promise<ResolvedStore> {
  const cleanHost = host.split(':')[0]; // Remove port
  
  // Attempt 1: Custom domain lookup via StoreDomain table
  const storeDomain = await db.storeDomain.findUnique({
    where: { domain: cleanHost },
    include: { 
      store: { 
        select: { 
          id: true, 
          slug: true,
          domains: {
            select: {
              domain: true,
              isPrimary: true,
            }
          }
        } 
      } 
    },
  });
  
  if (storeDomain) {
    // Find primary domain from store's domains
    const primaryDomainRecord = storeDomain.store.domains.find(d => d.isPrimary);
    const primaryDomain = primaryDomainRecord?.domain;
    
    // Check if we need to redirect to primary domain
    const needsCanonicalRedirect = primaryDomain && primaryDomain !== cleanHost;
    
    return {
      storeId: storeDomain.storeId,
      slug: storeDomain.store.slug,
      primaryDomain,
      isSubdomain: false,
      needsCanonicalRedirect: !!needsCanonicalRedirect,
    };
  }
  
  // Attempt 2: Subdomain extraction
  const subdomain = extractSubdomain(cleanHost, baseDomain);
  
  if (!subdomain) {
    throw new NotFoundError('Store', cleanHost);
  }
  
  // Find store by slug
  const store = await db.store.findUnique({
    where: { slug: subdomain },
    select: {
      id: true,
      slug: true,
      domains: {
        select: {
          domain: true,
          isPrimary: true,
        }
      },
    },
  });
  
  if (!store) {
    throw new NotFoundError('Store', subdomain);
  }
  
  // Check if custom primary domain exists
  const primaryDomainRecord = store.domains.find(d => d.isPrimary);
  const primaryDomain = primaryDomainRecord?.domain;
  
  // If we're on subdomain but have a primary custom domain, redirect is needed
  const needsCanonicalRedirect = !!primaryDomain && primaryDomain !== `${subdomain}.${baseDomain}`;
  
  return {
    storeId: store.id,
    slug: store.slug,
    primaryDomain,
    isSubdomain: true,
    needsCanonicalRedirect,
  };
}

/**
 * Build canonical redirect URL
 * 
 * @param primaryDomain - Primary custom domain
 * @param path - Request path
 * @returns Full canonical URL
 */
export function buildCanonicalUrl(primaryDomain: string, path: string): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${primaryDomain}${path}`;
}
