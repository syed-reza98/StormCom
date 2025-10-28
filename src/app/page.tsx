import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HomePage(): React.JSX.Element {
  return (
    <main className="container py-12">
      <section className="mx-auto max-w-5xl text-center">
        <h1 className="text-balance text-4xl sm:text-5xl font-bold tracking-tight">Welcome to StormCom</h1>
        <p className="mt-3 text-lg text-muted-foreground">Multi-tenant E-commerce SaaS Platform</p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/products" className={cn(buttonVariants())}>Go to Dashboard</Link>
          <Button variant="outline">Read Docs</Button>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">🏪 Multi-tenant</h2>
              <p className="text-muted-foreground">Manage multiple stores from a single platform</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">🛒 E-commerce</h2>
              <p className="text-muted-foreground">Complete product catalog and checkout system</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">⚡ Next.js 16</h2>
              <p className="text-muted-foreground">Built with the latest Next.js App Router</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 rounded-lg border bg-card text-card-foreground p-4">
          <p className="text-sm">
            🚀 <span className="font-medium">Status:</span> Setup phase in progress. Installing dependencies...
          </p>
        </div>
      </section>
    </main>
  );
}
