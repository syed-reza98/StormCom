import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/login?callbackUrl=/dashboard');
  }

  const hasStores = session.user.stores && session.user.stores.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <a href="/dashboard" className="text-xl font-bold">StormCom</a>
          <div className="flex items-center gap-4">
            {hasStores && (
              <span className="text-sm">{session.user.stores[0].storeName}</span>
            )}
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
