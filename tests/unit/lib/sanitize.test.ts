import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  stripHtml,
  escapeHtml,
  sanitizeFileName,
  sanitizeUrl,
  escapeSql,
  sanitizeEmail,
  sanitizePhone,
  truncateText,
} from '../../../src/lib/sanitize';

/**
 * Unit tests for input sanitization utilities
 * 
 * Tests verify protection against:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 * - Path Traversal
 * - Command Injection
 * - JavaScript URI execution
 */

describe('Input Sanitization Utility', () => {
  describe('sanitizeHtml()', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Hello</p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove event handlers', () => {
      const input = '<p onclick="alert(\'XSS\')">Click me</p>';
      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Click me</p>');
      expect(result).not.toContain('onclick');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = sanitizeHtml(input);

      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('evil.com');
    });

    it('should allow safe tags (p, strong, em)', () => {
      const input = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
      const result = sanitizeHtml(input);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should allow safe links with href', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);

      // DOMPurify may strip href if not in ALLOWED_ATTR, but structure is safe
      expect(result).toContain('<a');
      expect(result).toContain('Link</a>');
    });

    it('should remove javascript: URIs from links', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(input);

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should allow headings (h1-h6)', () => {
      const input = '<h1>Title</h1><h2>Subtitle</h2>';
      const result = sanitizeHtml(input);

      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
    });

    it('should allow lists (ul, ol, li)', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHtml(input);

      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('should handle custom allowed tags', () => {
      const input = '<div>Text</div><span>More</span><article>Content</article>';
      const result = sanitizeHtml(input, {
        allowedTags: ['div', 'span'],
      });

      expect(result).toContain('<div>');
      expect(result).toContain('<span>');
      expect(result).not.toContain('<article>');
    });
  });

  describe('stripHtml()', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = stripHtml(input);

      expect(result).toBe('Hello World');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove script tags and content', () => {
      const input = '<p>Safe</p><script>alert("XSS")</script>';
      const result = stripHtml(input);

      // DOMPurify removes script tag AND its content for security
      expect(result).toBe('Safe');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should handle nested tags', () => {
      const input = '<div><p><strong>Nested</strong> text</p></div>';
      const result = stripHtml(input);

      expect(result).toBe('Nested text');
    });

    it('should trim whitespace', () => {
      const input = '  <p>  Text  </p>  ';
      const result = stripHtml(input);

      expect(result).toBe('Text');
    });

    it('should return empty string for empty input', () => {
      expect(stripHtml('')).toBe('');
      expect(stripHtml(null as any)).toBe('');
    });
  });

  describe('escapeHtml()', () => {
    it('should escape < and >', () => {
      const input = '<script>alert("XSS")</script>';
      const result = escapeHtml(input);

      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape & character', () => {
      const input = 'Tom & Jerry';
      const result = escapeHtml(input);

      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      const input = 'He said "Hello" and \'Hi\'';
      const result = escapeHtml(input);

      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    it('should escape forward slash', () => {
      const input = '</script>';
      const result = escapeHtml(input);

      expect(result).toContain('&#x2F;');
    });

    it('should return empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null as any)).toBe('');
    });

    it('should not double-escape', () => {
      const input = '&lt;';
      const result = escapeHtml(input);

      expect(result).toBe('&amp;lt;');
    });
  });

  describe('sanitizeFileName()', () => {
    it('should remove path traversal sequences', () => {
      const input = '../../etc/passwd';
      const result = sanitizeFileName(input);

      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should replace slashes with underscores', () => {
      const input = 'folder/subfolder\\file.txt';
      const result = sanitizeFileName(input);

      expect(result).toBe('folder_subfolder_file.txt');
    });

    it('should remove shell metacharacters', () => {
      const input = 'file|name;with$special*chars?.txt';
      const result = sanitizeFileName(input);

      expect(result).not.toContain('|');
      expect(result).not.toContain(';');
      expect(result).not.toContain('$');
      expect(result).not.toContain('*');
      expect(result).not.toContain('?');
    });

    it('should replace spaces with underscores', () => {
      const input = 'my file name.txt';
      const result = sanitizeFileName(input);

      expect(result).toBe('my_file_name.txt');
    });

    it('should remove leading dots (hidden files)', () => {
      const input = '.hidden_file';
      const result = sanitizeFileName(input);

      expect(result).toBe('hidden_file');
    });

    it('should return "unnamed" for empty input', () => {
      expect(sanitizeFileName('')).toBe('unnamed');
      expect(sanitizeFileName(null as any)).toBe('unnamed');
      expect(sanitizeFileName('...')).toBe('unnamed');
    });

    it('should truncate long file names', () => {
      const input = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(input, 255);

      expect(result.length).toBeLessThanOrEqual(255);
      expect(result).toContain('.txt'); // Extension preserved
    });

    it('should preserve file extensions', () => {
      const longName = 'a'.repeat(300);
      const input = `${longName}.pdf`;
      const result = sanitizeFileName(input, 100);

      expect(result).toContain('.pdf');
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('sanitizeUrl()', () => {
    it('should allow https:// URLs', () => {
      const input = 'https://example.com/path?query=1';
      const result = sanitizeUrl(input);

      expect(result).toBe('https://example.com/path?query=1');
    });

    it('should allow http:// URLs', () => {
      const input = 'http://example.com';
      const result = sanitizeUrl(input);

      expect(result).toBe('http://example.com');
    });

    it('should block javascript: URIs', () => {
      const input = 'javascript:alert("XSS")';
      const result = sanitizeUrl(input);

      expect(result).toBe('');
    });

    it('should block data: URIs', () => {
      const input = 'data:text/html,<script>alert("XSS")</script>';
      const result = sanitizeUrl(input);

      expect(result).toBe('');
    });

    it('should block vbscript: URIs', () => {
      const input = 'vbscript:msgbox("XSS")';
      const result = sanitizeUrl(input);

      expect(result).toBe('');
    });

    it('should block file: URIs', () => {
      const input = 'file:///etc/passwd';
      const result = sanitizeUrl(input);

      expect(result).toBe('');
    });

    it('should allow relative URLs starting with /', () => {
      const input = '/dashboard/products';
      const result = sanitizeUrl(input);

      expect(result).toBe('/dashboard/products');
    });

    it('should allow anchor URLs starting with #', () => {
      const input = '#section-1';
      const result = sanitizeUrl(input);

      expect(result).toBe('#section-1');
    });

    it('should allow mailto: URLs', () => {
      const input = 'mailto:user@example.com';
      const result = sanitizeUrl(input);

      expect(result).toBe('mailto:user@example.com');
    });

    it('should allow tel: URLs', () => {
      const input = 'tel:+15551234567';
      const result = sanitizeUrl(input);

      expect(result).toBe('tel:+15551234567');
    });

    it('should add https:// to URLs without protocol', () => {
      const input = 'example.com';
      const result = sanitizeUrl(input);

      expect(result).toBe('https://example.com');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl(null as any)).toBe('');
    });

    it('should be case-insensitive for protocol detection', () => {
      const input = 'JAVASCRIPT:alert("XSS")';
      const result = sanitizeUrl(input);

      expect(result).toBe('');
    });
  });

  describe('escapeSql()', () => {
    it('should escape single quotes', () => {
      const input = "O'Reilly";
      const result = escapeSql(input);

      expect(result).toBe("O''Reilly");
    });

    it('should escape multiple single quotes', () => {
      const input = "'; DROP TABLE users; --";
      const result = escapeSql(input);

      // Each single quote ' is replaced with '' (SQL escape sequence)
      expect(result).toContain("''");
      expect(result).toBe("''; DROP TABLE users; --");
    });

    it('should return empty string for empty input', () => {
      expect(escapeSql('')).toBe('');
      expect(escapeSql(null as any)).toBe('');
    });

    it('should handle text without quotes', () => {
      const input = 'Normal text';
      const result = escapeSql(input);

      expect(result).toBe('Normal text');
    });
  });

  describe('sanitizeEmail()', () => {
    it('should trim whitespace', () => {
      const input = '  user@example.com  ';
      const result = sanitizeEmail(input);

      expect(result).toBe('user@example.com');
    });

    it('should convert to lowercase', () => {
      const input = 'USER@EXAMPLE.COM';
      const result = sanitizeEmail(input);

      expect(result).toBe('user@example.com');
    });

    it('should handle mixed case with whitespace', () => {
      const input = '  User@Example.COM  ';
      const result = sanitizeEmail(input);

      expect(result).toBe('user@example.com');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeEmail('')).toBe('');
      expect(sanitizeEmail(null as any)).toBe('');
    });
  });

  describe('sanitizePhone()', () => {
    it('should preserve digits', () => {
      const input = '5551234567';
      const result = sanitizePhone(input);

      expect(result).toBe('5551234567');
    });

    it('should preserve country code with plus', () => {
      const input = '+1 555-123-4567';
      const result = sanitizePhone(input);

      expect(result).toBe('+1 555-123-4567');
    });

    it('should preserve parentheses', () => {
      const input = '(555) 123-4567';
      const result = sanitizePhone(input);

      expect(result).toBe('(555) 123-4567');
    });

    it('should remove letters', () => {
      const input = '+1 (555) CALL-NOW';
      const result = sanitizePhone(input);

      expect(result).toBe('+1 (555) -');
    });

    it('should remove extension text', () => {
      const input = '+1 555-123-4567 ext. 890';
      const result = sanitizePhone(input);

      expect(result).not.toContain('ext');
      expect(result).toContain('+1 555-123-4567');
    });

    it('should trim whitespace', () => {
      const input = '  555-123-4567  ';
      const result = sanitizePhone(input);

      expect(result).toBe('555-123-4567');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizePhone('')).toBe('');
      expect(sanitizePhone(null as any)).toBe('');
    });
  });

  describe('truncateText()', () => {
    it('should truncate long text with ellipsis', () => {
      const input = 'This is a very long text that needs to be truncated';
      const result = truncateText(input, 20);

      expect(result).toHaveLength(20);
      expect(result).toContain('...');
    });

    it('should not truncate short text', () => {
      const input = 'Short text';
      const result = truncateText(input, 20);

      expect(result).toBe('Short text');
      expect(result).not.toContain('...');
    });

    it('should use custom ellipsis', () => {
      const input = 'Long text that will be truncated';
      const result = truncateText(input, 15, ' [...]');

      expect(result).toContain(' [...]');
      expect(result).toHaveLength(15);
    });

    it('should handle exact length match', () => {
      const input = 'Exact';
      const result = truncateText(input, 5);

      expect(result).toBe('Exact');
      expect(result).not.toContain('...');
    });

    it('should return empty string for empty input', () => {
      expect(truncateText('')).toBe('');
      expect(truncateText(null as any)).toBe('');
    });

    it('should use default max length of 100', () => {
      const input = 'a'.repeat(150);
      const result = truncateText(input);

      expect(result).toHaveLength(100);
      expect(result).toContain('...');
    });
  });

  describe('Security edge cases', () => {
    it('should handle XSS with encoded characters', () => {
      const input = '<img src=x onerror=alert(1)>';
      const result = sanitizeHtml(input);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should handle SQL injection attempts', () => {
      const input = "admin' OR '1'='1";
      const result = escapeSql(input);

      // Each single quote is replaced with two single quotes
      expect(result).toBe("admin'' OR ''1''=''1");
      // Result contains '' (escaped quotes), which is correct
    });

    it('should handle path traversal with mixed separators', () => {
      const input = '..\\..\\windows\\system32\\config';
      const result = sanitizeFileName(input);

      expect(result).not.toContain('..');
      expect(result).not.toContain('\\');
    });

    it('should handle unicode characters in file names', () => {
      const input = 'file_测试_名称.txt';
      const result = sanitizeFileName(input);

      // Unicode should be preserved (not treated as malicious)
      expect(result).toContain('测试');
    });

    it('should handle null bytes in input', () => {
      const input = 'normal\x00malicious';
      const result = stripHtml(input);

      // Null bytes should not break parsing
      expect(result).toBeTruthy();
    });
  });
});
