/**
 * Storefront Footer Component
 * 
 * Customer-facing footer with links, social media, and newsletter signup.
 * Semantic HTML with proper ARIA labels for accessibility.
 * 
 * Features:
 * - Company information
 * - Help & support links
 * - Legal links
 * - Social media icons
 * - Newsletter signup
 * - Copyright notice
 * 
 * @module components/storefront/storefront-footer
 */

import Link from 'next/link';
import {
  TwitterLogoIcon,
  GitHubLogoIcon,
  LinkedInLogoIcon,
  InstagramLogoIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  shop: {
    title: 'Shop',
    links: [
      { href: '/shop/products', label: 'All Products' },
      { href: '/shop/categories', label: 'Categories' },
      { href: '/shop/search', label: 'Search' },
      { href: '/shop/cart', label: 'Shopping Cart' },
    ],
  },
  account: {
    title: 'Account',
    links: [
      { href: '/shop/profile', label: 'My Profile' },
      { href: '/shop/orders', label: 'My Orders' },
      { href: '/shop/wishlists', label: 'Wishlist' },
      { href: '/login', label: 'Sign In' },
    ],
  },
  help: {
    title: 'Help & Support',
    links: [
      { href: '/shop/help/faq', label: 'FAQ' },
      { href: '/shop/help/shipping', label: 'Shipping Info' },
      { href: '/shop/help/returns', label: 'Returns' },
      { href: '/shop/help/contact', label: 'Contact Us' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { href: '/shop/legal/privacy', label: 'Privacy Policy' },
      { href: '/shop/legal/terms', label: 'Terms of Service' },
      { href: '/shop/legal/cookies', label: 'Cookie Policy' },
      { href: '/shop/legal/accessibility', label: 'Accessibility' },
    ],
  },
};

const socialLinks = [
  { href: 'https://twitter.com/stormcom', label: 'Twitter', icon: TwitterLogoIcon },
  { href: 'https://github.com/stormcom', label: 'GitHub', icon: GitHubLogoIcon },
  { href: 'https://linkedin.com/company/stormcom', label: 'LinkedIn', icon: LinkedInLogoIcon },
  { href: 'https://instagram.com/stormcom', label: 'Instagram', icon: InstagramLogoIcon },
];

export function StorefrontFooter() {
  return (
    <footer className="border-t bg-muted/30" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info & Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to our newsletter for exclusive deals and updates.
            </p>
            <form className="flex gap-2 mb-6" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                aria-label="Email address for newsletter"
              />
              <Button type="submit">Subscribe</Button>
            </form>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit us on ${social.label}`}
                    className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold mb-4" id={`${key}-heading`}>
                {section.title}
              </h3>
              <nav aria-labelledby={`${key}-heading`}>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} StormCom. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link
              href="/shop/legal/privacy"
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Privacy
            </Link>
            <Link
              href="/shop/legal/terms"
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Terms
            </Link>
            <Link
              href="/shop/legal/cookies"
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
