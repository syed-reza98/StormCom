/**
 * Storefront Homepage
 * 
 * Server Component displaying hero banner, featured products,
 * category showcase, and promotional sections.
 */

import Link from 'next/link';
import { ArrowRight, ShoppingBag, TrendingUp, Shield } from 'lucide-react';
import { getFeaturedProducts, getCategoryTree } from '@/services/storefront-service';
import { ProductCard } from '@/components/storefront/product-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function Homepage() {
  // Fetch featured products and categories
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts('store-placeholder', 8),
    getCategoryTree('store-placeholder'),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to StormCom
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover amazing products at unbeatable prices. Shop the latest trends and enjoy fast, free shipping on orders over $50.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/products">
                <Button size="lg">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Free Shipping</h3>
              <p className="text-sm text-muted-foreground">
                On orders over $50
              </p>
            </Card>
            <Card className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Best Prices</h3>
              <p className="text-sm text-muted-foreground">
                Price match guarantee
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Secure Checkout</h3>
              <p className="text-sm text-muted-foreground">
                100% secure payments
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
                <p className="text-muted-foreground">
                  Handpicked favorites just for you
                </p>
              </div>
              <Link href="/products">
                <Button variant="outline">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Showcase */}
      {categories.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">
                Browse our curated collections
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>

            {categories.length > 8 && (
              <div className="text-center mt-8">
                <Link href="/categories">
                  <Button variant="outline" size="lg">
                    View All Categories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Promotional Banner */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Sign up for exclusive deals!
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Get 10% off your first order when you subscribe to our newsletter
            </p>
            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded bg-white text-foreground"
                aria-label="Email address"
              />
              <Button size="lg" variant="secondary">
                Subscribe
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Why Shop With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Products Available</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <p className="text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <p className="text-muted-foreground">Uptime Guarantee</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <p className="text-muted-foreground">Customer Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
