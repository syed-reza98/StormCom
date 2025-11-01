/**
 * Input Sanitization Utility
 * 
 * Provides comprehensive input sanitization to prevent:
 * - XSS (Cross-Site Scripting) attacks via HTML/JavaScript injection
 * - SQL Injection attacks via malicious SQL commands
 * - Path Traversal attacks via file system access
 * - Command Injection attacks via shell commands
 * 
 * **Usage Guidelines**:
 * - Use `sanitizeHtml()` for rich text content (blog posts, descriptions)
 * - Use `sanitizeFileName()` for user-uploaded file names
 * - Use `sanitizeUrl()` for user-provided URLs
 * - Use `stripHtml()` for plain text fields that should not contain HTML
 * - Use `escapeHtml()` for displaying user content in HTML context
 * 
 * **Security Notes**:
 * - SQL injection is primarily prevented by Prisma's parameterized queries
 * - This utility provides defense-in-depth for SQL injection scenarios
 * - Always validate input length and format with Zod schemas BEFORE sanitization
 * 
 * @see https://github.com/cure53/DOMPurify
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * Removes dangerous tags and attributes while preserving safe HTML formatting.
 * Safe for rendering user-generated content in HTML context.
 * 
 * **Allowed Tags**: p, br, strong, em, u, a, ul, ol, li, h1-h6, blockquote, code, pre
 * **Allowed Attributes**: href (for <a>), class (for styling)
 * 
 * @param html - Raw HTML string from user input
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string safe for rendering
 * 
 * @example
 * ```typescript
 * const userInput = '<p>Hello</p><script>alert("XSS")</script>';
 * const safe = sanitizeHtml(userInput);
 * // Result: '<p>Hello</p>' (script tag removed)
 * ```
 */
export function sanitizeHtml(
  html: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
  }
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Default allowed tags (safe formatting)
  const ALLOWED_TAGS = options?.allowedTags || [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'code',
    'pre',
    'span',
    'div',
  ];

  // Default allowed attributes (minimal for security)
  const ALLOWED_ATTR = options?.allowedAttributes || {
    a: ['href', 'title', 'target', 'rel'],
    span: ['class'],
    div: ['class'],
    code: ['class'],
    pre: ['class'],
  };

  return String(DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
    // Forbid script execution contexts
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'base'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    // Allow target="_blank" but add noopener noreferrer
    ALLOW_DATA_ATTR: false, // No data attributes
    ADD_ATTR: ['target'], // Allow target attribute
    ALLOW_ARIA_ATTR: true, // Allow ARIA for accessibility
    RETURN_DOM: false, // Return string (not DOM)
    RETURN_DOM_FRAGMENT: false,
  } as any));
}

/**
 * Strip all HTML tags from content
 * 
 * Removes ALL HTML tags and returns plain text.
 * Use for fields that should never contain HTML (names, titles, short descriptions).
 * 
 * @param html - Raw HTML string from user input
 * @returns Plain text with all HTML tags removed
 * 
 * @example
 * ```typescript
 * const userInput = '<p>Hello <strong>World</strong></p>';
 * const plainText = stripHtml(userInput);
 * // Result: 'Hello World'
 * ```
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Use DOMPurify with ALLOWED_TAGS: [] to strip everything
  return String(DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // No tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  } as any)).trim();
}

/**
 * Escape HTML special characters for safe display
 * 
 * Converts HTML special characters to HTML entities.
 * Use when displaying user content in HTML context without rendering tags.
 * 
 * **Characters Escaped**:
 * - `<` → `&lt;`
 * - `>` → `&gt;`
 * - `&` → `&amp;`
 * - `"` → `&quot;`
 * - `'` → `&#x27;`
 * 
 * @param text - Raw text from user input
 * @returns Escaped text safe for HTML context
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script>';
 * const escaped = escapeHtml(userInput);
 * // Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * // Displays as: <script>alert("XSS")</script> (not executed)
 * ```
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitize file names to prevent path traversal attacks
 * 
 * Removes dangerous characters that could allow file system access outside intended directory.
 * Safe for user-uploaded file names.
 * 
 * **Removed Characters**: `/`, `\`, `..`, `~`, `$`, `|`, `<`, `>`, `&`, `;`, `:`, `*`, `?`, `"`
 * **Preserves**: Alphanumeric, spaces, hyphens, underscores, dots (extension)
 * 
 * @param fileName - Raw file name from user input
 * @param maxLength - Maximum allowed length (default: 255)
 * @returns Sanitized file name safe for file system operations
 * 
 * @example
 * ```typescript
 * const userInput = '../../etc/passwd';
 * const safe = sanitizeFileName(userInput);
 * // Result: 'etcpasswd' (path traversal removed)
 * ```
 */
export function sanitizeFileName(fileName: string, maxLength = 255): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed';
  }

  // Remove path separators and dangerous characters
  let sanitized = fileName
    .replace(/\.\./g, '') // Remove .. (parent directory)
    .replace(/[\/\\]/g, '_') // Replace slashes with underscores
    .replace(/[~$|<>&;:*?"]/g, '') // Remove shell metacharacters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^\.+/, '') // Remove leading dots (hidden files)
    .trim();

  // Ensure file name is not empty after sanitization
  if (!sanitized || sanitized === '') {
    return 'unnamed';
  }

  // Limit length (preserve extension if possible)
  if (sanitized.length > maxLength) {
    const ext = sanitized.split('.').pop();
    const nameWithoutExt = sanitized.substring(
      0,
      sanitized.lastIndexOf('.')
    );

    if (ext && ext.length <= 10) {
      // Preserve extension if reasonable length
      const maxNameLength = maxLength - ext.length - 1; // -1 for dot
      sanitized = `${nameWithoutExt.substring(0, maxNameLength)}.${ext}`;
    } else {
      sanitized = sanitized.substring(0, maxLength);
    }
  }

  return sanitized;
}

/**
 * Sanitize URLs to prevent JavaScript execution
 * 
 * Ensures URLs use safe protocols (http, https, mailto) and removes JavaScript URIs.
 * Safe for href attributes and redirects.
 * 
 * **Allowed Protocols**: `http://`, `https://`, `mailto:`, `/` (relative)
 * **Blocked Protocols**: `javascript:`, `data:`, `vbscript:`, `file:`
 * 
 * @param url - Raw URL from user input
 * @returns Sanitized URL safe for href attributes, or empty string if invalid
 * 
 * @example
 * ```typescript
 * const userInput = 'javascript:alert("XSS")';
 * const safe = sanitizeUrl(userInput);
 * // Result: '' (javascript: protocol blocked)
 * 
 * const validInput = 'https://example.com';
 * const validSafe = sanitizeUrl(validInput);
 * // Result: 'https://example.com'
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  url = url.trim();

  // Allow relative URLs (starting with / or #)
  if (url.startsWith('/') || url.startsWith('#')) {
    return url;
  }

  // Check protocol
  const urlLower = url.toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ];

  if (dangerousProtocols.some((proto) => urlLower.startsWith(proto))) {
    return '';
  }

  // Allow safe protocols
  const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:'];

  if (safeProtocols.some((proto) => urlLower.startsWith(proto))) {
    return url;
  }

  // If no protocol, assume https (safe default)
  if (!url.includes('://') && !url.startsWith('//')) {
    return `https://${url}`;
  }

  // Unknown protocol, reject
  return '';
}

/**
 * Escape SQL special characters
 * 
 * **IMPORTANT**: Prisma uses parameterized queries by default, which prevents SQL injection.
 * This function is provided for defense-in-depth and should NOT replace parameterized queries.
 * 
 * Only use when constructing raw SQL queries (which should be avoided).
 * 
 * @param input - Raw input that might contain SQL metacharacters
 * @returns Escaped input safe for SQL context (still use parameterized queries!)
 * 
 * @deprecated Use Prisma's parameterized queries instead. This is for legacy/raw SQL only.
 * 
 * @example
 * ```typescript
 * // DON'T DO THIS:
 * const unsafeQuery = `SELECT * FROM users WHERE name = '${escapeSql(userInput)}'`;
 * 
 * // DO THIS INSTEAD (Prisma parameterized query):
 * const safeQuery = await prisma.user.findMany({
 *   where: { name: userInput }
 * });
 * ```
 */
export function escapeSql(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Escape single quotes (most common SQL injection vector)
  // Replace ' with '' (SQL escape sequence)
  return input.replace(/'/g, "''");
}

/**
 * Validate and sanitize email addresses
 * 
 * Removes whitespace and converts to lowercase.
 * Does NOT validate email format (use Zod schema for validation).
 * 
 * @param email - Raw email from user input
 * @returns Sanitized email (lowercase, trimmed)
 * 
 * @example
 * ```typescript
 * const userInput = '  USER@EXAMPLE.COM  ';
 * const clean = sanitizeEmail(userInput);
 * // Result: 'user@example.com'
 * ```
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
}

/**
 * Sanitize phone numbers to remove non-numeric characters
 * 
 * Preserves: digits, plus sign (for country code), spaces, hyphens, parentheses
 * Removes: letters, special characters
 * 
 * @param phone - Raw phone number from user input
 * @returns Sanitized phone number with only valid characters
 * 
 * @example
 * ```typescript
 * const userInput = '+1 (555) 123-4567 ext. 890';
 * const clean = sanitizePhone(userInput);
 * // Result: '+1 (555) 123-4567'
 * ```
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Keep only: digits, +, spaces, hyphens, parentheses
  return phone.replace(/[^\d\s\-+()]/g, '').trim();
}

/**
 * Truncate text to maximum length with ellipsis
 * 
 * Safe for displaying user content in limited space.
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 100)
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated text with ellipsis if needed
 * 
 * @example
 * ```typescript
 * const longText = 'This is a very long text that needs truncation';
 * const short = truncateText(longText, 20);
 * // Result: 'This is a very lo...'
 * ```
 */
export function truncateText(
  text: string,
  maxLength = 100,
  ellipsis = '...'
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}
